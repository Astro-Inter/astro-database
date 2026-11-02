import { escapeHtml } from '../../utils.js';

const margin = 48;
const header = 96;
const footer = 68;
const font = 'Consolas, "Liberation Mono", monospace';

const cleanPath = value => value.replaceAll('[]', '');
export function compactGraph(graph) {
  // Cada campo aparece uma vez, dentro do documento mais específico já modelado.
  return { ...graph, nodes: graph.nodes.map(node => {
    const siblings = graph.nodes.filter(item => item.collection.name === node.collection.name && item.type === 'embedded');
    const fields = node.collection.fields.filter(field => {
      const owner = siblings.filter(item => cleanPath(field.name).startsWith(`${cleanPath(item.name)}.`)).sort((a, b) => b.name.length - a.name.length)[0];
      return owner ? owner.id === node.id : node.type === 'collection';
    });
    return { ...node, fields };
  }) };
}

const fieldLabel = (node, field, compact) => compact && node.type === 'embedded' ? field.name.slice(node.name.length).replace(/^\[\]\.|^\./, '') : field.name;
function titleLines(name, width, measure) {
  const lines = []; let line = '';
  for (const char of name) {
    if (line && measure(line + char, 10) > width - 36) { lines.push(line); line = ''; }
    line += char;
  }
  if (line) lines.push(line);
  return lines;
}

/** Componentes conectados são indivisíveis: nenhuma entidade ou relação cruza páginas. */
export function exportGroups(graph) {
  const pending = new Set(graph.nodes.map(node => node.id));
  const groups = [];
  while (pending.size) {
    const ids = new Set();
    const queue = [pending.values().next().value];
    while (queue.length) {
      const id = queue.shift();
      if (!pending.delete(id)) continue;
      ids.add(id);
      for (const edge of graph.edges) {
        if (edge.from === id && pending.has(edge.to)) queue.push(edge.to);
        if (edge.to === id && pending.has(edge.from)) queue.push(edge.from);
      }
    }
    groups.push({ nodes: graph.nodes.filter(node => ids.has(node.id)), edges: graph.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)) });
  }
  return groups;
}

function text(value, x, y, { size = 13, color = '#1c1839', weight = 'normal', measure } = {}) {
  // Largura explícita preserva o alinhamento mesmo em visualizadores sem Consolas.
  const length = measure?.(String(value), size, weight);
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}"${length ? ` textLength="${length}" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeHtml(String(value))}</text>`;
}

/** Layout de exportação usa nomes completos e medidas tipográficas, nunca o viewport. */
export function exportLayout(graph, measure = (value, size) => Array.from(value).length * size * 0.64, compact = false) {
  if (compact) graph = compactGraph(graph);
  const components = exportGroups(graph);
  const widths = graph.nodes.map(node => Math.max(
    compact ? 300 : 380,
    measure(compact ? node.name.split('.').at(-1) : node.name, compact ? 14 : 16, 'bold') + 40,
    ...node.fields.map(field => measure(fieldLabel(node, field, compact), 13) + measure(field.type, 13) + (compact ? 52 : 76)),
  ));
  const width = Math.ceil(Math.max(compact ? 300 : 380, ...widths));
  const row = compact ? 22 : 26;
  const heading = node => compact && node.type === 'embedded' ? 64 + titleLines(node.name, width, measure).length * 12 : 68;
  const nodeHeight = node => heading(node) + 20 + node.fields.length * row;
  const positions = {};
  const groups = [];
  let top = 0;
  for (const component of components) {
    const start = top;
    for (const collection of component.nodes.filter(node => node.type === 'collection')) {
      const children = component.nodes.filter(node => node.type === 'embedded' && node.collection.name === collection.id);
      const height = nodeHeight(collection);
      positions[collection.id] = { x: 220, y: top, width, height, heading: heading(collection), row };
      let childTop = top;
      for (const child of children) {
        const childHeight = nodeHeight(child);
        positions[child.id] = { x: width + (compact ? 340 : 540), y: childTop, width, height: childHeight, heading: heading(child), row };
        childTop += childHeight + (compact ? 24 : 48);
      }
      top = Math.max(top + height, children.length ? childTop - (compact ? 24 : 48) : top) + 100;
    }
    // Faixas exclusivas à esquerda acomodam referências, rótulos e autorreferências.
    const referenceCount = component.edges.filter(edge => edge.type === 'reference').length;
    const lane = Math.max(compact ? 110 : 220, referenceCount * 30 + 60);
    component.nodes.forEach(node => { positions[node.id].x += lane - 220; });
    const labelBottom = Math.max(0, ...component.edges.filter(edge => edge.type === 'reference').map(edge => Math.min(positions[edge.from].y, positions[edge.to].y) + 36 + measure(edge.label, 11)));
    top = Math.max(top, labelBottom + 124);
    groups.push({ ...component, top: start, bottom: top - 100, lane });
    top += 40;
  }
  if (compact) {
    // Colunas de grupos independentes: aproveitar áreas vazias sem separar relações.
    const groupWidth = Math.max(1, ...Object.values(positions).map(p => p.x + p.width)) + 40;
    const heights = [0, 0];
    for (const group of [...groups].sort((a, b) => (b.bottom - b.top) - (a.bottom - a.top))) {
      const column = heights[0] <= heights[1] ? 0 : 1;
      const left = column * groupWidth; const y = heights[column]; const height = group.bottom - group.top;
      for (const node of group.nodes) { positions[node.id].x += left; positions[node.id].y += y - group.top; }
      group.left = left; group.top = y; group.bottom = y + height;
      heights[column] = group.bottom + 64;
    }
    groups.sort((a, b) => a.top - b.top || a.left - b.left);
    top = Math.max(...heights) + 76;
  }
  return { positions, groups, width: Math.max(1, ...Object.values(positions).map(p => p.x + p.width)), height: Math.max(1, top - 140), measure, compact };
}

export function exportPages(layout, paginated, targetHeight = 1800) {
  if (!layout.groups.length) return [];
  if (!paginated) return [{ groups: layout.groups, top: 0, bottom: layout.height }];
  const pages = [];
  let current;
  for (const group of layout.groups) {
    if (!current || group.bottom - current.top > targetHeight) {
      current = { groups: [], top: group.top, bottom: group.bottom };
      pages.push(current);
    }
    current.groups.push(group);
    current.bottom = Math.max(current.bottom, group.bottom);
  }
  return pages;
}

export function exportSvg(layout, page, pageIndex = 0, pageCount = 1) {
  const measure = layout.measure;
  const pageLeft = Math.min(...page.groups.map(group => group.left || 0));
  const pageRight = Math.max(...page.groups.flatMap(group => group.nodes.map(node => layout.positions[node.id].x + layout.positions[node.id].width)));
  const width = Math.max(640, pageRight - pageLeft) + margin * 2;
  const height = page.bottom - page.top + margin * 2 + header + footer;
  const nodes = page.groups.flatMap(group => group.nodes);
  const edges = page.groups.flatMap(group => group.edges);
  const label = pageCount > 1 ? `Página ${pageIndex + 1} de ${pageCount}` : 'Diagrama completo';
  const drawText = (value, x, y, options = {}) => text(value, x, y, { measure, ...options });
  const paths = page.groups.map(group => {
    let laneIndex = 0;
    return group.edges.map(edge => {
      const a = layout.positions[edge.from]; const b = layout.positions[edge.to];
      const reference = edge.type === 'reference';
      const color = reference ? '#416a9a' : '#288d50';
      let d; let caption;
      if (reference) {
        const lane = (group.left || 0) + 40 + laneIndex++ * 30;
        const y1 = a.y + 30; const y2 = b.y + (edge.from === edge.to ? 62 : 30);
        d = `M${a.x} ${y1} H${lane} V${y2} H${b.x}`;
        const labelY = Math.min(y1, y2) + 6;
        caption = `<g transform="translate(${lane - 8} ${labelY}) rotate(90)">${drawText(edge.label, 0, 0, { size: 11, color })}</g>`;
      } else {
        const x1 = a.x + a.width; const x2 = b.x;
        const y1 = a.y + 40; const y2 = b.y + 40;
        d = `M${x1} ${y1} C${x1 + (layout.compact ? 30 : 90)} ${y1} ${x2 - (layout.compact ? 30 : 90)} ${y2} ${x2} ${y2}`;
        caption = layout.compact ? '' : drawText('embutido', x1 + 16, y1 - 14, { size: 11, color });
      }
      return `<g data-export-edge="${escapeHtml(`${edge.from}→${edge.to}:${edge.label}`)}"><title>${escapeHtml(`${edge.from} → ${edge.to}: ${edge.label}`)}</title><path d="${d}" stroke="${color}" stroke-width="2" fill="none"${reference ? ' stroke-dasharray="7 5"' : ''} marker-end="url(#export-${edge.type})"/>${caption}</g>`;
    }).join('');
  }).join('');
  const cards = nodes.map(node => {
    const p = layout.positions[node.id];
    const title = layout.compact ? node.name.split('.').at(-1) : node.name;
    const breadcrumb = layout.compact && node.type === 'embedded' ? titleLines(node.name, p.width, measure).map((line, index) => drawText(line, 18, 66 + index * 12, { size: 10, color: '#61776a' })).join('') : '';
    return `<g data-export-node="${escapeHtml(node.id)}" transform="translate(${p.x} ${p.y})"><title>${escapeHtml(node.name)}</title><rect width="${p.width}" height="${p.height}" rx="10" fill="${node.type === 'embedded' ? '#edf7f0' : '#ffffff'}" stroke="#9bbda8" stroke-width="1.5"/>${drawText(node.type === 'collection' ? 'COLEÇÃO' : 'DOCUMENTO EMBUTIDO', 18, 24, { size: 11, color: '#61776a' })}${drawText(title, 18, 51, { size: layout.compact ? 14 : 16, weight: 'bold', color: '#176338' })}${breadcrumb}<line x1="0" x2="${p.width}" y1="${p.heading - 3}" y2="${p.heading - 3}" stroke="#c9d8cf"/>${node.fields.map((field, index) => `<g data-export-field="${escapeHtml(field.name)}">${drawText(fieldLabel(node, field, layout.compact), 18, p.heading + 20 + index * p.row)}${drawText(field.type, p.width - 18 - measure(field.type, 13), p.heading + 20 + index * p.row, { color: '#62766a' })}</g>`).join('')}</g>`;
  }).join('');
  return { width, height, nodeCount: nodes.length, edgeCount: edges.length, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family='${font}'><title>MongoDB — Modelagem das coleções — ${label}</title><defs>${['embedded', 'reference'].map(type => `<marker id="export-${type}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="${type === 'reference' ? '#416a9a' : '#288d50'}" d="M0 0L10 5L0 10Z"/></marker>`).join('')}</defs><rect width="100%" height="100%" fill="#f7faf8"/>${drawText('MongoDB · Modelagem das coleções', margin, margin + 24, { size: 22, weight: 'bold', color: '#176338' })}${drawText(`${label} · ${nodes.length} blocos · ${edges.length} relações`, margin, margin + 52, { size: 13, color: '#61776a' })}<g transform="translate(${margin - pageLeft} ${margin + header - page.top})">${paths}${cards}</g><g transform="translate(${margin} ${height - margin - 20})"><line x1="0" x2="32" y1="0" y2="0" stroke="#288d50" stroke-width="2"/>${drawText('Documento embutido', 42, 5, { size: 12 })}<line x1="260" x2="292" y1="0" y2="0" stroke="#416a9a" stroke-width="2" stroke-dasharray="7 5"/>${drawText('Referência declarada', 302, 5, { size: 12 })}</g></svg>` };
}

export function compactModelSvg(graph, state) {
  if (!graph.nodes.length) return '';
  const layout = exportLayout(graph, undefined, true);
  const file = exportSvg(layout, exportPages(layout, false)[0]);
  return file.svg.replace('<svg ', `<svg class="mongo-model-svg" style="width:${file.width * state.zoom}px;height:${file.height * state.zoom}px" `).replace(/data-export-node="([^"]+)"/g, (match, id) => {
    const node = graph.nodes.find(item => escapeHtml(item.id) === id);
    const active = !state.query || `${node.name} ${node.collection.fields.map(field => field.name).join(' ')}`.toLowerCase().includes(state.query.toLowerCase());
    return `${match} data-mongo-node="${id}" role="button" tabindex="0" aria-label="${id}" class="mongo-model-node ${node.type} ${state.selected === node.id ? 'selected' : ''} ${active ? '' : 'dimmed'}"`;
  });
}

export async function buildMongoExports(graph, paginated, compact = true) {
  await document.fonts.ready;
  const context = document.createElement('canvas').getContext('2d');
  const measure = (value, size, weight = 'normal') => { context.font = `${weight} ${size}px ${font}`; return Math.ceil(context.measureText(value).width); };
  const layout = exportLayout(graph, measure, compact);
  const pages = exportPages(layout, paginated);
  return pages.map((page, index) => {
    const file = exportSvg(layout, page, index, pages.length);
    // Conferir os limites efetivos de textos, caminhos e cards após a renderização.
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';
    host.innerHTML = file.svg; document.body.append(host);
    try {
      const svg = host.querySelector('svg'); const box = svg.getBBox();
      const x = Math.min(0, Math.floor(box.x)) - 24; const y = Math.min(0, Math.floor(box.y)) - 24;
      file.width = Math.ceil(Math.max(file.width, box.x + box.width) - x + 24);
      file.height = Math.ceil(Math.max(file.height, box.y + box.height) - y + 24);
      svg.setAttribute('viewBox', `${x} ${y} ${file.width} ${file.height}`);
      svg.setAttribute('width', file.width); svg.setAttribute('height', file.height);
      const background = svg.querySelector(':scope > rect');
      background.setAttribute('x', x); background.setAttribute('y', y);
      background.setAttribute('width', file.width); background.setAttribute('height', file.height);
      file.svg = new XMLSerializer().serializeToString(svg);
      return file;
    } finally { host.remove(); }
  });
}

export async function svgToPng(file) {
  // Nunca reduzir silenciosamente a resolução. Preservar 2x ou explicar o limite.
  const scale = 2;
  const width = Math.ceil(file.width * scale); const height = Math.ceil(file.height * scale);
  if (width > 32767 || height > 32767 || width * height > 120000000) throw new Error('Este PNG excede o limite de imagem do navegador. Use SVG completo ou PNG em páginas.');
  const url = URL.createObjectURL(new Blob([file.svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível criar a imagem. Use a exportação SVG.');
    context.scale(scale, scale); context.drawImage(image, 0, 0);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('O navegador não conseguiu gerar este PNG. Use SVG ou páginas.')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

/** ZIP sem compressão: um download, sem permissões para múltiplos arquivos. */
export async function exportZip(files) {
  const encoder = new TextEncoder(); const chunks = []; const directory = []; let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const bytes = new Uint8Array(await file.blob.arrayBuffer());
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = new Uint8Array(30 + name.length); const a = new DataView(local.buffer);
    a.setUint32(0, 0x04034b50, true); a.setUint16(4, 20, true); a.setUint16(6, 0x800, true); a.setUint32(14, crc, true); a.setUint32(18, bytes.length, true); a.setUint32(22, bytes.length, true); a.setUint16(26, name.length, true); local.set(name, 30);
    const central = new Uint8Array(46 + name.length); const b = new DataView(central.buffer);
    b.setUint32(0, 0x02014b50, true); b.setUint16(4, 20, true); b.setUint16(6, 20, true); b.setUint16(8, 0x800, true); b.setUint32(16, crc, true); b.setUint32(20, bytes.length, true); b.setUint32(24, bytes.length, true); b.setUint16(28, name.length, true); b.setUint32(42, offset, true); central.set(name, 46);
    chunks.push(local, bytes); directory.push(central); offset += local.length + bytes.length;
  }
  const size = directory.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22); const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, size, true); view.setUint32(16, offset, true);
  return new Blob([...chunks, ...directory, end], { type: 'application/zip' });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function mountMongoExport(root, graph) {
  const status = root.querySelector('[data-mongo-export-status]');
  const capture = root.querySelector('[data-mongo-capture]');
  capture.addEventListener('click', async () => {
    try {
      const [file] = await buildMongoExports(graph, false, root.querySelector('[data-mongo-export-layout]').value === 'compact');
      if (!file) throw new Error('Nenhuma coleção disponível para captura.');
      const dialog = document.createElement('dialog'); dialog.className = 'mongo-capture';
      dialog.setAttribute('aria-label', 'Captura do modelo MongoDB');
      dialog.innerHTML = `<button class="button mongo-capture-close" autofocus>Voltar · Esc</button><div class="mongo-capture-sheet">${file.svg}</div>`;
      document.body.append(dialog);
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { dialog.remove(); capture.focus(); }, { once: true });
      dialog.showModal();
    } catch (error) { status.textContent = error.message; }
  });
  root.querySelectorAll('[data-mongo-export]').forEach(button => button.addEventListener('click', async () => {
    const buttons = root.querySelectorAll('[data-mongo-export]');
    buttons.forEach(item => { item.disabled = true; });
    try {
      const format = button.dataset.mongoExport;
      const paginated = root.querySelector('[data-mongo-export-pages]').value === 'pages';
      status.textContent = 'Preparando o diagrama completo…';
      const compact = root.querySelector('[data-mongo-export-layout]').value === 'compact';
      const pages = await buildMongoExports(graph, paginated, compact);
      if (!pages.length) throw new Error('Nenhuma coleção disponível para exportar.');
      const files = [];
      for (const [index, page] of pages.entries()) {
        status.textContent = `Gerando ${index + 1} de ${pages.length}…`;
        const blob = format === 'png' ? await svgToPng(page) : new Blob([page.svg], { type: 'image/svg+xml;charset=utf-8' });
        files.push({ name: `mongo-modelo${compact ? '-compacto' : ''}${paginated ? `-pagina-${String(index + 1).padStart(2, '0')}` : '-completo'}.${format}`, blob });
      }
      if (paginated) downloadBlob(await exportZip(files), `mongo-modelo${compact ? '-compacto' : ''}-paginas-${format}.zip`);
      else downloadBlob(files[0].blob, files[0].name);
      status.textContent = `${pages.length} ${pages.length === 1 ? 'imagem gerada' : 'páginas geradas'} · todos os blocos e relações incluídos.`;
    } catch (error) { status.textContent = `Não foi possível exportar: ${error.message}`; }
    finally { buttons.forEach(item => { item.disabled = false; }); }
  }));
}

import { escapeHtml, icon } from '../../utils.js';

export function createMongoModelState() {
  return { zoom: 1, query: '', selected: null, positions: {}, expanded: false, view: 'conceptual', scope: '', fitted: false, scroll: { left: 0, top: 0 } };
}

const cleanPath = (name) => name.replaceAll('[]', '');
const short = (value, length) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
const matches = (node, query) => `${node.name} ${node.type === 'collection' ? `${node.collection.title ?? ''} ${node.collection.description ?? ''}` : ''} ${(node.type === 'collection' ? node.collection.fields : node.fields).map((field) => field.name).join(' ')}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(query.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase());

/** Cada documento pertence ao ancestral mais próximo; IDs não implicam referências. */
export function mongoGraph(collections) {
  const nodes = [];
  const edges = [];
  for (const collection of collections) {
    const containers = collection.fields.filter((field) => /object/.test(field.type) || (/array/.test(field.type) && collection.fields.some((item) => cleanPath(item.name).startsWith(`${cleanPath(field.name)}.`))));
    const parentOf = (field) => containers.filter((parent) => cleanPath(field.name).startsWith(`${cleanPath(parent.name)}.`)).sort((a, b) => b.name.length - a.name.length)[0];
    nodes.push({ id: collection.name, name: collection.name, collection, fields: collection.fields.filter((field) => !parentOf(field)), type: 'collection' });
    for (const field of containers) {
      const parent = parentOf(field);
      const id = `${collection.name}::${field.name}`;
      nodes.push({ id, name: field.name, collection, field, fields: collection.fields.filter((item) => parentOf(item) === field), type: 'embedded' });
      edges.push({ from: parent ? `${collection.name}::${parent.name}` : collection.name, to: id, label: field.name, type: 'embedded' });
    }
    for (const field of collection.fields) {
      if (field.references && collections.some((item) => item.name === field.references)) {
        const parent = parentOf(field);
        edges.push({ from: parent ? `${collection.name}::${parent.name}` : collection.name, to: field.references, label: field.name, type: 'reference' });
      }
    }
  }
  return { nodes, edges };
}

function visibleGraph(graph, state) {
  if (state.view !== 'structure') return { nodes: graph.nodes.filter((node) => node.type === 'collection'), edges: graph.edges.filter((edge) => edge.type === 'reference').map((edge) => ({ ...edge, from: graph.nodes.find((node) => node.id === edge.from).collection.name })) };
  const scope = state.scope || graph.nodes[0]?.collection.name;
  const nodes = graph.nodes.filter((node) => node.collection.name === scope);
  const ids = new Set(nodes.map((node) => node.id));
  return { nodes, edges: graph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)) };
}

export function mongoModelLayout(graph, { conceptual = false } = {}) {
  const positions = {};
  if (conceptual) {
    // Coleções conectadas ficam próximas; coleções independentes ocupam as linhas seguintes.
    const pending = new Set(graph.nodes.map((node) => node.id));
    const groups = [];
    while (pending.size) {
      const group = [];
      const queue = [pending.values().next().value];
      while (queue.length) {
        const id = queue.shift();
        if (!pending.delete(id)) continue;
        group.push(id);
        for (const edge of graph.edges) {
          if (edge.from === id && pending.has(edge.to)) queue.push(edge.to);
          if (edge.to === id && pending.has(edge.from)) queue.push(edge.from);
        }
      }
      groups.push(group);
    }
    let row = 0;
    for (const group of groups.filter((items) => items.length > 1)) {
      group.forEach((id, index) => { positions[id] = { x: 40 + (index % 3) * 370, y: 68 + (row + Math.floor(index / 3)) * 266, width: 310, height: 178 }; });
      row += Math.ceil(group.length / 3);
    }
    groups.filter((items) => items.length === 1).flat().forEach((id, index) => { positions[id] = { x: 40 + (index % 3) * 370, y: 68 + (row + Math.floor(index / 3)) * 266, width: 310, height: 178 }; });
    return { positions, width: 1130, height: Math.max(300, ...Object.values(positions).map((p) => p.y + p.height + 40)) };
  }
  const children = (id) => graph.edges.filter((edge) => edge.type === 'embedded' && edge.from === id).map((edge) => graph.nodes.find((node) => node.id === edge.to));
  const nodeHeight = (node) => 86 + node.fields.length * 28;
  const subtreeHeight = (node) => Math.max(nodeHeight(node), children(node.id).reduce((sum, child) => sum + subtreeHeight(child) + 32, -32));
  const place = (node, depth, top) => {
    positions[node.id] = { x: 40 + depth * 440, y: top, width: 350, height: nodeHeight(node) };
    let childY = top;
    for (const child of children(node.id)) { place(child, depth + 1, childY); childY += subtreeHeight(child) + 32; }
  };
  let top = 40;
  for (const node of graph.nodes.filter((item) => item.type === 'collection')) { place(node, 0, top); top += subtreeHeight(node) + 64; }
  return { positions, width: Math.max(440, ...Object.values(positions).map((p) => p.x + p.width + 40)), height: top };
}

function geometry(graph, state) {
  const layout = mongoModelLayout(graph, { conceptual: state.view !== 'structure' });
  const positions = Object.fromEntries(Object.entries(layout.positions).map(([id, position]) => [id, { ...position, ...state.positions[id] }]));
  return { positions, width: Math.max(layout.width, ...Object.values(positions).map((p) => p.x + p.width + 64)), height: Math.max(layout.height, ...Object.values(positions).map((p) => p.y + p.height + 40)) };
}

function diagram(graph, fullGraph, state) {
  const { positions, width, height } = geometry(graph, state);
  const conceptual = state.view !== 'structure';
  const related = new Set([state.selected]);
  graph.edges.forEach((edge) => { if (edge.from === state.selected || edge.to === state.selected) { related.add(edge.from); related.add(edge.to); } });
  const edges = graph.edges.map((edge) => {
    const from = positions[edge.from]; const to = positions[edge.to];
    const self = edge.from === edge.to;
    const forward = to.x >= from.x + from.width;
    const x1 = forward || self ? from.x + from.width : from.x;
    const x2 = forward ? to.x : to.x + to.width;
    const y1 = from.y + 52; const y2 = to.y + 52;
    const path = self ? `M${x1} ${y1} C${x1 + 64} ${y1 - 90} ${x1 + 64} ${y1 + 90} ${x1} ${y1 + 44}` : `M${x1} ${y1} C${x1 + (forward ? 35 : -35)} ${y1} ${x2 + (forward ? -35 : 35)} ${y2} ${x2} ${y2}`;
    const labelX = self ? x1 + 8 : (x1 + x2) / 2;
    const labelY = self ? y1 + 110 : Math.min(y1, y2) - 16;
    const label = edge.type === 'embedded' ? (/array/.test(graph.nodes.find((node) => node.id === edge.to).field.type) ? 'lista' : 'objeto') : short(edge.label, 28);
    return `<g class="mongo-model-edge ${edge.type} ${state.selected && ![edge.from, edge.to].includes(state.selected) ? 'dimmed' : ''}"><title>${escapeHtml(`${edge.label}: ${edge.from} → ${edge.to}`)}</title><path d="${path}" marker-end="url(#mongo-arrow-${edge.type})"/><text x="${labelX}" y="${labelY}" text-anchor="${self ? 'start' : 'middle'}">${escapeHtml(label)}</text></g>`;
  }).join('');
  const nodes = graph.nodes.map((node) => {
    const p = positions[node.id];
    const dimmed = (state.query && !matches(node, state.query)) || (state.selected && !related.has(node.id));
    const documents = fullGraph.nodes.filter((item) => item.type === 'embedded' && item.collection.name === node.collection.name);
    const title = conceptual ? node.name : node.type === 'embedded' ? node.name.split('.').at(-1) : node.name;
    const contents = conceptual ? `<text class="mongo-model-subtitle" x="18" y="81">${escapeHtml(short(node.collection.title || node.name, 36))}</text><text class="mongo-model-summary" x="18" y="112">${node.collection.fields.length} campos · ${documents.length} ${documents.length === 1 ? 'documento embutido' : 'documentos embutidos'}</text><line x1="18" x2="${p.width - 18}" y1="130" y2="130"/><text class="mongo-model-hint" x="18" y="154">${escapeHtml(documents.length ? short(documents.filter((item) => !item.name.includes('.')).map((item) => item.name).join(' · '), 38) : 'Documento sem estrutura embutida')}</text>` : node.fields.map((field, index) => {
      const name = node.type === 'embedded' ? field.name.slice(node.name.replace(/\[\]$/, '').length).replace(/^\[\]\.|^\./, '') : field.name;
      return `<g><title>${escapeHtml(`${field.name}: ${field.type}`)}</title><text class="mongo-model-field" x="18" y="${88 + index * 28}">${escapeHtml(short(name, 27))}</text><text class="mongo-model-type" x="${p.width - 18}" y="${88 + index * 28}" text-anchor="end">${escapeHtml(short(field.type, 20))}</text></g>`;
    }).join('');
    return `<g class="mongo-model-node ${node.type} ${state.selected === node.id ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}" data-mongo-node="${escapeHtml(node.id)}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${escapeHtml(`${node.type === 'collection' ? 'Coleção' : 'Documento embutido'} ${node.name}`)}" aria-pressed="${state.selected === node.id}"><title>${escapeHtml(`${node.name}: ${node.collection.description ?? ''}`)}</title><rect width="${p.width}" height="${p.height}" rx="12"/><text class="mongo-model-kind" x="18" y="24">${node.type === 'collection' ? 'COLEÇÃO' : /array/.test(node.field.type) ? 'LISTA DE DOCUMENTOS' : 'DOCUMENTO EMBUTIDO'}</text><text class="mongo-model-name" x="18" y="49">${escapeHtml(short(title, 37))}</text>${contents}</g>`;
  }).join('');
  return `<svg class="mongo-model-svg" viewBox="0 0 ${width} ${height}" style="width:${width * state.zoom}px;height:${height * state.zoom}px" aria-label="${conceptual ? 'Diagrama conceitual das coleções MongoDB' : 'Estrutura dos documentos MongoDB'}"><defs>${['embedded', 'reference'].map((type) => `<marker id="mongo-arrow-${type}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="${type === 'reference' ? '#416a9a' : '#288d50'}" d="M0 0L10 5L0 10Z"/></marker>`).join('')}</defs>${edges}${nodes}</svg>`;
}

export function mongoModelView(data, state) {
  const fullGraph = mongoGraph(data.collections);
  const graph = visibleGraph(fullGraph, state);
  const selected = graph.nodes.find((node) => node.id === state.selected);
  const references = fullGraph.edges.filter((edge) => edge.type === 'reference').length;
  return `<section class="card mongo-model-card ${state.expanded ? 'expanded' : ''}">
    <div class="card-head"><div><p class="eyebrow">Mapa documental</p><h2>Diagrama conceitual das coleções</h2><p class="muted">Explore as referências entre coleções e a composição de cada documento.</p></div><button class="button ghost" data-mongo-model-action="expand">${icon('expand', 16)} ${state.expanded ? 'Reduzir' : 'Expandir'}</button></div>
    <div class="mongo-model-overview"><span><strong>${data.collections.length}</strong> coleções</span><span><strong>${references}</strong> referências declaradas</span><span><strong>${fullGraph.nodes.length - data.collections.length}</strong> documentos embutidos</span></div>
    <div class="mongo-model-navigation"><div class="mongo-model-switch" role="group" aria-label="Visão do diagrama"><button data-mongo-view="conceptual" aria-pressed="${state.view !== 'structure'}">Visão conceitual</button><button data-mongo-view="structure" aria-pressed="${state.view === 'structure'}">Estrutura do documento</button></div>${state.view === 'structure' ? `<label class="mongo-model-scope">Coleção <select aria-label="Coleção da estrutura" data-mongo-scope>${data.collections.map((collection) => `<option value="${escapeHtml(collection.name)}" ${collection.name === (state.scope || data.collections[0]?.name) ? 'selected' : ''}>${escapeHtml(collection.name)}</option>`).join('')}</select></label>` : '<span class="mongo-model-navigation-note">Selecione uma coleção para explorar seus vínculos</span>'}</div>
    <div class="mongo-model-toolbar"><label class="search-box" for="mongo-model-search">${icon('search', 16)}<input id="mongo-model-search" type="search" aria-label="Localizar coleção ou campo" placeholder="Localizar coleção ou campo…" value="${escapeHtml(state.query)}"/></label><div class="mongo-model-controls"><button class="icon-button" data-mongo-model-action="out" aria-label="Reduzir zoom">${icon('minus', 16)}</button><output>${Math.round(state.zoom * 100)}%</output><button class="icon-button" data-mongo-model-action="in" aria-label="Aumentar zoom">${icon('plus', 16)}</button><button class="button ghost" data-mongo-model-action="fit">Ajustar à tela</button><button class="button ghost" data-mongo-model-action="reset">Restaurar</button></div></div>
    <div class="mongo-model-canvas" tabindex="0" aria-label="Área navegável da modelagem MongoDB">${graph.nodes.length ? diagram(graph, fullGraph, state) : '<div class="empty"><strong>Nenhuma collection documentada.</strong></div>'}</div>
    <div class="mongo-model-selection">${selected ? `<div><p class="eyebrow">${selected.type === 'collection' ? 'Coleção selecionada' : 'Documento embutido'}</p><strong>${escapeHtml(selected.name)}</strong><p>${escapeHtml(selected.collection.description ?? '')}</p></div><div class="mongo-model-controls">${state.view !== 'structure' ? '<button class="button ghost" data-mongo-model-action="structure">Explorar estrutura</button>' : ''}<button class="button ghost" data-mongo-model-open="${escapeHtml(selected.collection.name)}">Abrir documentação ${icon('arrowRight', 14)}</button></div>` : '<p>Selecione um documento para ver seu contexto. Arraste os cards ou o fundo para navegar.</p>'}</div>
    <div class="mongo-model-legend"><span><i class="reference"></i>Referência entre coleções</span><span><i></i>Documento embutido na coleção</span><span>Duplo clique abre a documentação</span></div><p class="mongo-model-note">As referências exibidas são as declaradas no catálogo; um campo com ID não cria uma ligação automaticamente. A estrutura mostra objetos e listas dentro de seus respectivos documentos.</p>
  </section>`;
}

export function mountMongoModel(root, data, state, rerender, onOpen) {
  const canvas = root.querySelector('.mongo-model-canvas');
  if (!canvas) return;
  const fullGraph = mongoGraph(data.collections);
  const graph = visibleGraph(fullGraph, state);
  const layout = mongoModelLayout(graph, { conceptual: state.view !== 'structure' });
  const renderDiagram = () => { canvas.innerHTML = graph.nodes.length ? diagram(graph, fullGraph, state) : '<div class="empty"><strong>Nenhuma collection documentada.</strong></div>'; };
  const zoom = (value) => {
    state.zoom = Math.max(0.15, Math.min(2, value));
    renderDiagram();
    root.querySelector('.mongo-model-controls output').textContent = `${Math.round(state.zoom * 100)}%`;
  };
  const fit = () => { const { width } = geometry(graph, state); zoom(Math.min(1, (canvas.clientWidth - 24) / width)); state.scroll = { left: 0, top: 0 }; canvas.scrollTo(0, 0); };
  if (!state.fitted && graph.nodes.length) {
    // A estrutura pode ter muitos níveis: abrir em escala legível e permitir navegar.
    if (state.view === 'structure') { zoom(1); canvas.scrollTo(0, 0); }
    else fit();
    state.fitted = true;
  }
  else canvas.scrollTo(state.scroll.left, state.scroll.top);
  canvas.addEventListener('scroll', () => { state.scroll = { left: canvas.scrollLeft, top: canvas.scrollTop }; });
  const changeView = (view, scope = state.scope) => { state.view = view; state.scope = scope; state.selected = null; state.positions = {}; state.query = ''; state.fitted = false; state.scroll = { left: 0, top: 0 }; rerender(); };
  root.querySelectorAll('[data-mongo-view]').forEach((button) => button.addEventListener('click', () => changeView(button.dataset.mongoView, fullGraph.nodes.find((node) => node.id === state.selected)?.collection.name || state.scope)));
  root.querySelector('[data-mongo-scope]')?.addEventListener('change', (event) => changeView('structure', event.target.value));
  root.querySelectorAll('[data-mongo-model-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.mongoModelAction;
    if (action === 'in' || action === 'out') zoom(state.zoom + (action === 'in' ? 0.15 : -0.15));
    if (action === 'fit') fit();
    if (action === 'reset') { state.positions = {}; state.selected = null; state.query = ''; state.fitted = false; state.scroll = { left: 0, top: 0 }; rerender(); }
    if (action === 'expand') { state.expanded = !state.expanded; rerender(); }
    if (action === 'structure') changeView('structure', fullGraph.nodes.find((node) => node.id === state.selected)?.collection.name);
  }));
  root.querySelector('#mongo-model-search').addEventListener('input', (event) => {
    state.query = event.target.value; renderDiagram();
    const match = graph.nodes.find((node) => state.query && matches(node, state.query));
    if (match) { const p = { ...layout.positions[match.id], ...state.positions[match.id] }; canvas.scrollTo({ left: Math.max(0, p.x * state.zoom - 30), top: Math.max(0, p.y * state.zoom - 30) }); }
  });
  let drag = null;
  let moved = false;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const id = event.target.closest('[data-mongo-node]')?.dataset.mongoNode;
    drag = { id, x: event.clientX, y: event.clientY, scrollX: canvas.scrollLeft, scrollY: canvas.scrollTop, position: id ? { ...layout.positions[id], ...state.positions[id] } : null };
    moved = false; canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) < 4) return;
    moved = true;
    if (drag.id) { state.positions[drag.id] = { x: Math.max(10, drag.position.x + dx / state.zoom), y: Math.max(10, drag.position.y + dy / state.zoom) }; renderDiagram(); }
    else canvas.scrollTo(drag.scrollX - dx, drag.scrollY - dy);
  });
  const select = (id) => { state.selected = state.selected === id ? null : id; state.scroll = { left: canvas.scrollLeft, top: canvas.scrollTop }; rerender(); };
  canvas.addEventListener('pointerup', () => {
    const id = drag?.id; drag = null;
    if (!id || moved) return;
    const now = Date.now();
    if (state.lastClick?.id === id && now - state.lastClick.time < 350) { state.lastClick = null; onOpen(graph.nodes.find((node) => node.id === id).collection.name); return; }
    state.lastClick = { id, time: now }; select(id);
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('keydown', (event) => { const id = event.target.closest('[data-mongo-node]')?.dataset.mongoNode; if (id && ['Enter', ' '].includes(event.key)) { event.preventDefault(); select(id); root.querySelectorAll('[data-mongo-node]').forEach((node) => { if (node.dataset.mongoNode === id) node.focus(); }); } });
  root.querySelector('[data-mongo-model-open]')?.addEventListener('click', (event) => onOpen(event.currentTarget.dataset.mongoModelOpen));
}

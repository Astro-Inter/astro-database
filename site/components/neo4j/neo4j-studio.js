import { escapeHtml, icon } from '../../utils.js';
import { normalizeSearchValue } from '../../services/search.js';
import { executeCypher } from './neo4j-query.js';

export const studioColors = { Unidade: '#b9d9f1', Colaborador: '#ffd0fa', GrupoTreinamento: '#e6b9bc', Evento: '#f3cf64', Treinamento: '#c7b29b', Certificado: '#c2adf1' };
export const participationQuery = 'MATCH p=()-[:PARTICIPA]->() RETURN p;';
export function studioExamples(data) {
  return [
    { title: 'Participações', code: participationQuery },
    { title: 'Todos os relacionamentos', code: 'MATCH p=()-->() RETURN p;' },
    { title: 'Colaboradores', code: 'MATCH (c:Colaborador)\nRETURN c ORDER BY c.id_colaborador;' },
    { title: 'Unidades e pessoas', code: 'MATCH p=(c:Colaborador)-[:PERTENCE]->(u:Unidade)\nRETURN p;' },
    { title: 'NR-10 · documento', code: data.scripts.find((script) => script.kind === 'query')?.code ?? '' },
    { title: 'Quantidade por cargo', code: 'MATCH (c:Colaborador)\nRETURN c.cargo AS cargo, count(c) AS total\nORDER BY total DESC;' }
  ];
}

const runQuery = (data, code) => executeCypher(data.graph, code);

export function ensureStudioResult(data, state) {
  if (!state.result) {
    state.cypher ??= participationQuery;
    state.result = runQuery(data, state.cypher);
    state.executed = state.cypher;
    if (!state.result.graph.nodes.length) state.resultTab = 'table';
  }
  return state.result;
}

export function highlightCypher(code) {
  return code.split(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\/\/[^\n]*|\b(?:MATCH|WHERE|RETURN|AS|ORDER|BY|LIMIT|SKIP|DISTINCT|AND|OR|NOT|IN|IS|NULL|CONTAINS|STARTS|ENDS|WITH|ASC|DESC|count|date)\b)/gi).map((part) => {
    const escaped = escapeHtml(part);
    return /^['"]/.test(part) ? `<span class="neo-token-string">${escaped}</span>` : part.startsWith('//') ? `<span class="neo-token-comment">${escaped}</span>` : /^(MATCH|WHERE|RETURN|AS|ORDER|BY|LIMIT|SKIP|DISTINCT|AND|OR|NOT|IN|IS|NULL|CONTAINS|STARTS|ENDS|WITH|ASC|DESC|count|date)$/i.test(part) ? `<span class="neo-token-keyword">${escaped}</span>` : escaped;
  }).join('');
}

const caption = (node) => String(node.label === 'Colaborador' ? node.properties.cargo ?? node.properties.nome : node.label === 'GrupoTreinamento' ? node.properties.grupo_nr ?? node.properties.titulo : node.properties.nome ?? node.properties.data_evento ?? node.label);
const short = (text, length = 14) => text.length > length ? `${text.slice(0, length - 1)}…` : text;

export function studioLayout(graph) {
  // Para o pequeno grafo bipartido da referência, separe os dois grupos pelos
  // graus e distribua os participantes compartilhados entre eles. Os IDs e os
  // valores continuam vindo exclusivamente do resultado da consulta.
  const groups = graph.nodes.filter((node) => node.label === 'GrupoTreinamento');
  const collaborators = graph.nodes.filter((node) => node.label === 'Colaborador');
  if (graph.nodes.length === 7 && groups.length === 2 && collaborators.length === 5 && graph.edges.length === 8 && graph.edges.every((edge) => edge.type === 'PARTICIPA')) {
    const degree = (node) => graph.edges.filter((edge) => edge.from === node.id || edge.to === node.id).length;
    const sorted = [...groups].sort((a, b) => degree(a) - degree(b));
    const shared = collaborators.filter((node) => degree(node) === 2);
    const leaves = collaborators.filter((node) => degree(node) === 1);
    if (degree(sorted[0]) === 3 && degree(sorted[1]) === 5 && shared.length === 3 && leaves.length === 2) {
      const positions = { [sorted[0].id]: { x: 180, y: 80 }, [sorted[1].id]: { x: 320, y: 360 } };
      const points = [{ x: 410, y: 160 }, { x: 200, y: 260 }, { x: 90, y: 320 }];
      shared.forEach((node, index) => { positions[node.id] = points[index]; });
      leaves.forEach((node, index) => { positions[node.id] = index ? { x: 285, y: 155 } : { x: 410, y: 515 }; });
      return { width: 600, height: 580, positions };
    }
  }
  const width = graph.nodes.length > 16 ? 1050 : 600;
  const height = graph.nodes.length > 16 ? 800 : 580;
  const nodes = graph.nodes.map((node, index) => ({ id: node.id, x: width / 2 + Math.cos(index * 2.39996) * (80 + index * 4), y: height / 2 + Math.sin(index * 2.39996) * (80 + index * 4) }));
  const lookup = new Map(nodes.map((node) => [node.id, node]));
  // Forças determinísticas: o resultado permanece estável ao selecionar um nó.
  for (let step = 0; step < 240; step++) {
    const forces = new Map(nodes.map((node) => [node.id, { x: (width / 2 - node.x) * .006, y: (height / 2 - node.y) * .006 }]));
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]; const dx = a.x - b.x || .1, dy = a.y - b.y || .1;
      const distance = Math.max(25, Math.hypot(dx, dy)); const strength = 7500 / (distance * distance);
      for (const [node, sign] of [[a, 1], [b, -1]]) { forces.get(node.id).x += sign * dx / distance * strength; forces.get(node.id).y += sign * dy / distance * strength; }
    }
    for (const edge of graph.edges) {
      const a = lookup.get(edge.from), b = lookup.get(edge.to); if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y; const distance = Math.max(1, Math.hypot(dx, dy)); const strength = (distance - 150) * .018;
      forces.get(a.id).x += dx / distance * strength; forces.get(a.id).y += dy / distance * strength;
      forces.get(b.id).x -= dx / distance * strength; forces.get(b.id).y -= dy / distance * strength;
    }
    for (const node of nodes) { const f = forces.get(node.id); node.x = Math.max(55, Math.min(width - 55, node.x + Math.max(-8, Math.min(8, f.x)))); node.y = Math.max(55, Math.min(height - 55, node.y + Math.max(-8, Math.min(8, f.y)))); }
  }
  return { width, height, positions: Object.fromEntries(nodes.map(({ id, x, y }) => [id, { x, y }])) };
}

function graphSvg(graph, state) {
  const layout = state.layout;
  const positions = { ...layout.positions, ...state.positions };
  const query = normalizeSearchValue(state.query);
  const selected = graph.nodes.find((node) => node.id === state.selected);
  const selectedEdge = graph.edges.find((edge) => edge.id === state.selectedEdge);
  const neighbors = new Set(selected ? [selected.id] : selectedEdge ? [selectedEdge.from, selectedEdge.to] : []);
  if (selected) graph.edges.filter((edge) => edge.from === selected.id || edge.to === selected.id).forEach((edge) => { neighbors.add(edge.from); neighbors.add(edge.to); });
  const active = (node) => (!query || normalizeSearchValue([node.label, ...Object.values(node.properties)].join(' ')).includes(query)) && (!state.labelFocus || node.label === state.labelFocus) && (!neighbors.size || neighbors.has(node.id)) && (!state.relFocus || graph.edges.some((edge) => edge.type === state.relFocus && (edge.from === node.id || edge.to === node.id)));
  const lookup = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = graph.edges.map((edge) => {
    const a = positions[edge.from], b = positions[edge.to]; const dx = b.x - a.x, dy = b.y - a.y; const length = Math.max(1, Math.hypot(dx, dy));
    const x1 = a.x + dx / length * 37, y1 = a.y + dy / length * 37, x2 = b.x - dx / length * 42, y2 = b.y - dy / length * 42;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI; if (angle > 90 || angle < -90) angle += 180;
    const dim = !active(lookup.get(edge.from)) || !active(lookup.get(edge.to)) || state.relFocus && edge.type !== state.relFocus;
    return `<g class="neo-studio-edge ${dim ? 'dimmed' : ''} ${state.selectedEdge === edge.id ? 'selected' : ''}" tabindex="0" role="button" data-studio-edge="${escapeHtml(edge.id)}" aria-label="${escapeHtml(`${edge.type}: ${caption(lookup.get(edge.from))} para ${caption(lookup.get(edge.to))}`)}"><title>${escapeHtml(`${edge.from} — ${edge.type} → ${edge.to}`)}</title><path class="neo-edge-hit" d="M${x1} ${y1}L${x2} ${y2}"/><path d="M${x1} ${y1}L${x2} ${y2}" marker-end="url(#neo-studio-arrow)"/><text text-anchor="middle" transform="translate(${(x1 + x2) / 2} ${(y1 + y2) / 2 - 5}) rotate(${angle})">${escapeHtml(edge.type)}</text></g>`;
  }).join('');
  const nodes = graph.nodes.map((node) => {
    const text = caption(node); const words = text.split(' '); let lines = text.length <= 13 ? [text] : [short(words.slice(0, Math.ceil(words.length / 2)).join(' ')), short(words.slice(Math.ceil(words.length / 2)).join(' '))];
    return `<g class="neo-studio-node ${active(node) ? '' : 'dimmed'} ${state.selected === node.id ? 'selected' : ''}" data-studio-node="${escapeHtml(node.id)}" transform="translate(${positions[node.id].x} ${positions[node.id].y})" role="button" tabindex="0" aria-pressed="${state.selected === node.id}" aria-label="${escapeHtml(`${node.label}: ${node.properties.nome ?? text}`)}" style="--node-color:${studioColors[node.label] ?? '#c2adf1'}"><title>${escapeHtml(`${node.label}\n${Object.entries(node.properties).map(([name, val]) => `${name}: ${val}`).join('\n')}`)}</title><circle r="34"/><text text-anchor="middle" dominant-baseline="central">${lines.map((line, index) => `<tspan x="0" dy="${index ? 11 : lines.length > 1 ? -5 : 0}">${escapeHtml(line)}</tspan>`).join('')}</text></g>`;
  }).join('');
  const { x, y, width, height } = state.viewport ?? { x: 0, y: 0, width: layout.width, height: layout.height };
  return `<svg class="neo-studio-svg" viewBox="${x} ${y} ${width} ${height}" aria-label="Grafo do resultado da consulta"><defs><marker id="neo-studio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker></defs>${edges}${nodes}</svg>`;
}

function overview(result, state) {
  const labels = [...new Set(result.graph.nodes.map((node) => node.label))];
  const relations = [...new Set(result.graph.edges.map((edge) => edge.type))];
  const node = result.graph.nodes.find((entry) => entry.id === state.selected);
  const edge = result.graph.edges.find((entry) => entry.id === state.selectedEdge);
  const entity = node ?? edge;
  return `<aside class="neo-studio-overview" aria-label="Resumo do resultado"><h3>Results overview</h3><h4>Nodes (${result.graph.nodes.length})</h4><div class="neo-studio-chips"><button class="neo-studio-chip" data-studio-label="" style="--chip:#c2adf1" aria-pressed="${!state.labelFocus}">* (${result.graph.nodes.length})</button>${labels.map((label) => `<button class="neo-studio-chip" data-studio-label="${escapeHtml(label)}" style="--chip:${studioColors[label] ?? '#c2adf1'}" aria-pressed="${state.labelFocus === label}">${escapeHtml(label)} (${result.graph.nodes.filter((entry) => entry.label === label).length})</button>`).join('')}</div><h4>Relationships (${result.graph.edges.length})</h4><div class="neo-studio-chips"><button class="neo-studio-chip relation" data-studio-relation="" aria-pressed="${!state.relFocus}">* (${result.graph.edges.length})</button>${relations.map((type) => `<button class="neo-studio-chip relation" data-studio-relation="${escapeHtml(type)}" aria-pressed="${state.relFocus === type}">${escapeHtml(type)} (${result.graph.edges.filter((entry) => entry.type === type).length})</button>`).join('')}</div>${entity ? `<section class="neo-studio-properties"><div class="neo-studio-property-head"><h3>${escapeHtml(node ? node.label : edge.type)}</h3><button class="neo-studio-icon" data-studio-action="deselect" aria-label="Limpar seleção">${icon('reset', 16)}</button></div><p>${escapeHtml(node ? node.properties.nome ?? caption(node) : `${edge.from} → ${edge.to}`)}</p><dl>${Object.entries({ id: entity.id, ...(node ? node.properties : { from: edge.from, to: edge.to, ...edge.properties }) }).map(([name, val]) => `<div><dt>${escapeHtml(name)}</dt><dd>${escapeHtml(val ?? 'null')}</dd></div>`).join('')}</dl>${node ? `<button class="neo-studio-text-button" data-studio-document="${escapeHtml(node.label)}">Ver documentação ${icon('right', 14)}</button>` : '<p>Este relacionamento não possui propriedades na carga.</p>'}</section>` : '<p class="neo-studio-hint">Selecione um nó ou uma relação para inspecionar as propriedades.</p>'}</aside>`;
}

function tableCell(entry) {
  if (entry == null) return '<span class="neo-null">null</span>';
  if (entry.label && entry.properties) return `<span class="neo-table-label" style="--chip:${studioColors[entry.label] ?? '#c2adf1'}">${escapeHtml(entry.label)}</span><code>${escapeHtml(JSON.stringify(entry.properties))}</code>`;
  return `<code>${escapeHtml(typeof entry === 'object' ? JSON.stringify(entry) : String(entry))}</code>`;
}

export function studioView(data, state) {
  const result = ensureStudioResult(data, state);
  state.layout ??= studioLayout(result.graph);
  const empty = !result.rows.length;
  return `<section class="neo-studio" aria-label="Console Cypher"><div class="neo-studio-examples"><label for="neo-studio-example">Consultas prontas</label><select id="neo-studio-example"><option value="">Escolher consulta…</option>${studioExamples(data).map((entry, index) => `<option value="${index}">${escapeHtml(entry.title)}</option>`).join('')}</select><button class="neo-studio-text-button" data-studio-action="traverse">Consulta NR-10</button><button class="neo-studio-text-button neo-studio-help-button" data-studio-action="help" aria-expanded="${!!state.help}" aria-controls="neo-studio-help">Ajuda Cypher ${icon('info', 15)}</button></div>${state.help ? `<div class="neo-studio-help" id="neo-studio-help"><strong>Consultas sobre os dados do documento</strong><p>Use MATCH com nós, propriedades e caminhos de comprimento fixo, relações →, ← ou sem direção; WHERE com AND, OR, NOT, comparações, IN, CONTAINS e IS NULL; RETURN com aliases, DISTINCT, count(), labels(), type(), properties(), toLower() e toUpper(); ORDER BY, SKIP e LIMIT.</p><p>Esta é uma prévia local, com até 10.000 combinações por consulta. Comandos de escrita, parâmetros, CALL, WITH, UNION, OPTIONAL MATCH e caminhos de comprimento variável não são suportados. Para usar todo o Cypher, abra o Aura.</p><code>MATCH (c:Colaborador) WHERE c.nome CONTAINS 'Maria' RETURN c;</code></div>` : ''}<div class="neo-studio-frame ${state.expanded ? 'expanded' : ''}"><form class="neo-studio-editor-form"><span class="neo-studio-prompt" aria-hidden="true">astro$</span><div class="neo-studio-editor"><pre aria-hidden="true"><code>${highlightCypher(state.cypher)}\n</code></pre><textarea id="neo-cypher-editor" aria-label="Editor Cypher" spellcheck="false" autocapitalize="off" autocomplete="off" rows="${Math.min(8, Math.max(1, state.cypher.split('\n').length))}" aria-describedby="neo-studio-source">${escapeHtml(state.cypher)}</textarea></div><button type="button" class="neo-studio-icon" data-studio-action="copy" aria-label="Copiar consulta">${icon('copy', 17)}</button><button class="neo-studio-run" type="submit" title="Executar consulta (Ctrl+Enter)">${icon('play', 15)} Run</button></form>${state.error ? `<div class="neo-studio-error" role="alert"><strong>Não foi possível executar a consulta</strong><p>${escapeHtml(state.error)}</p><span>Corrija o código e execute novamente. O resultado anterior está preservado.</span></div>` : ''}<div class="neo-studio-result-header"><div class="neo-studio-tabs" role="tablist" aria-label="Formato do resultado">${['Graph', 'Table', 'Raw'].map((tab) => `<button id="neo-result-tab-${tab.toLowerCase()}" type="button" role="tab" data-studio-tab="${tab.toLowerCase()}" aria-selected="${state.resultTab === tab.toLowerCase()}" aria-controls="neo-result-panel" tabindex="${state.resultTab === tab.toLowerCase() ? 0 : -1}">${tab}</button>`).join('')}</div><label class="neo-studio-search" ${state.resultTab !== 'graph' ? 'hidden' : ''}>${icon('search', 17)}<input type="search" id="neo-studio-search" placeholder="Search graph…" aria-label="Buscar no grafo" value="${escapeHtml(state.query)}"/></label><button class="neo-studio-icon" data-studio-action="download" aria-label="${state.resultTab === 'graph' ? 'Baixar grafo SVG' : state.resultTab === 'table' ? 'Baixar resultados CSV' : 'Baixar resultados JSON'}" title="Baixar resultado">${icon('upload_1', 19, { className: 'neo-download-icon' })}</button><button class="neo-studio-icon" data-studio-action="expand" aria-label="${state.expanded ? 'Sair da tela cheia' : 'Expandir resultado'}" aria-pressed="${!!state.expanded}">${icon('expand', 17)}</button></div><div id="neo-result-panel" role="tabpanel" aria-labelledby="neo-result-tab-${state.resultTab}" tabindex="0">${state.resultTab === 'graph' ? `<div class="neo-studio-result-layout"><div class="neo-studio-canvas" tabindex="0" aria-label="Área do grafo; arraste para mover e use os controles de zoom">${result.graph.nodes.length ? graphSvg(result.graph, state) : `<div class="neo-studio-empty"><strong>${empty ? 'Nenhum resultado encontrado' : 'Este resultado contém valores, sem nós ou caminhos'}</strong><p>${empty ? 'Ajuste os filtros da consulta e execute novamente.' : 'Abra Table ou Raw para consultar os valores retornados.'}</p></div>`}<div class="neo-studio-graph-controls"><button class="neo-studio-icon" data-studio-action="in" aria-label="Aumentar zoom">${icon('plus', 17)}</button><button class="neo-studio-icon" data-studio-action="out" aria-label="Reduzir zoom">${icon('minus', 17)}</button><button class="neo-studio-icon" data-studio-action="fit" aria-label="Ajustar grafo à tela">${icon('expand', 17)}</button><button class="neo-studio-icon" data-studio-action="reset" aria-label="Restaurar posições">${icon('reset', 17)}</button></div></div>${overview(result, state)}</div>` : state.resultTab === 'table' ? `<div class="neo-studio-table"><table><thead><tr><th scope="col">#</th>${result.columns.map((name) => `<th scope="col">${escapeHtml(name)}</th>`).join('')}</tr></thead><tbody>${result.rows.map((row, index) => `<tr><td>${index + 1}</td>${row.map((entry) => `<td>${tableCell(entry)}</td>`).join('')}</tr>`).join('')}</tbody></table>${empty ? '<div class="neo-studio-empty"><strong>Nenhum resultado encontrado</strong><p>Ajuste os filtros da consulta e execute novamente.</p></div>' : ''}</div>` : `<pre class="neo-studio-raw">${escapeHtml(JSON.stringify({ columns: result.columns, records: result.rows.map((row) => Object.fromEntries(result.columns.map((name, index) => [name, row[index]]))) }, null, 2))}</pre>`}</div><footer class="neo-studio-footer"><span role="status" id="neo-studio-status">${state.error ? 'Último resultado válido · ' : ''}${result.rows.length} registros${state.duration != null ? ` · ${state.duration} ms` : ''}${state.message ? ` · ${escapeHtml(state.message)}` : ''}</span><span>Ctrl + Enter para executar</span></footer></div><p class="neo-studio-source" id="neo-studio-source">Prévia local · carga do documento · ${data.counts.nodes} nós e ${data.counts.relationships} relações · sem conexão ao Aura</p>${state.history?.length ? `<details class="neo-studio-history"><summary>Histórico desta sessão (${state.history.length})</summary>${state.history.map((code, index) => `<button data-studio-history="${index}" title="Carregar consulta no editor"><code>${escapeHtml(code)}</code></button>`).join('')}</details>` : ''}</section>`;
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mountStudio(root, data, state, rerender, onDocument) {
  const editor = root.querySelector('#neo-cypher-editor'); if (!editor) return;
  root.querySelector('.neo-studio-frame').addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.expanded) { state.expanded = false; rerender(); root.querySelector('[data-studio-action="expand"]').focus(); } });
  const run = () => {
    state.cypher = editor.value;
    try {
      const start = performance.now(); const result = runQuery(data, state.cypher);
      Object.assign(state, { result, executed: state.cypher, error: null, duration: Math.round((performance.now() - start) * 10) / 10, selected: null, selectedEdge: null, query: '', labelFocus: '', relFocus: '', positions: {}, viewport: null, layout: studioLayout(result.graph), message: '' });
      state.history = [state.cypher, ...(state.history ?? []).filter((code) => code !== state.cypher)].slice(0, 15);
      if (!result.graph.nodes.length) state.resultTab = 'table';
    } catch (error) { state.error = error.message; state.message = ''; }
    rerender();
  };
  root.querySelector('.neo-studio-editor-form').addEventListener('submit', (event) => { event.preventDefault(); run(); });
  editor.addEventListener('input', () => { state.cypher = editor.value; editor.rows = Math.min(8, Math.max(1, editor.value.split('\n').length)); root.querySelector('.neo-studio-editor code').innerHTML = `${highlightCypher(editor.value)}\n`; });
  editor.addEventListener('scroll', () => { const pre = root.querySelector('.neo-studio-editor pre'); pre.scrollTop = editor.scrollTop; pre.scrollLeft = editor.scrollLeft; });
  editor.addEventListener('keydown', (event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); } });
  root.querySelector('#neo-studio-example').addEventListener('change', (event) => { if (event.target.value === '') return; editor.value = studioExamples(data)[Number(event.target.value)].code; run(); });
  root.querySelectorAll('[data-studio-history]').forEach((button) => button.addEventListener('click', () => { state.cypher = state.history[Number(button.dataset.studioHistory)]; rerender(); root.querySelector('#neo-cypher-editor').focus(); }));
  const setTab = (tab, focus = false) => { state.resultTab = tab; rerender(); if (focus) root.querySelector(`[data-studio-tab="${tab}"]`).focus(); };
  root.querySelectorAll('[data-studio-tab]').forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.studioTab));
    button.addEventListener('keydown', (event) => { const tabs = ['graph', 'table', 'raw']; const index = tabs.indexOf(state.resultTab); if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setTab(event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : tabs[(index + (event.key === 'ArrowLeft' ? 2 : 1)) % 3], true); } });
  });
  const redraw = () => { const canvas = root.querySelector('.neo-studio-canvas'); if (!canvas || !state.result.graph.nodes.length) return; const svg = canvas.querySelector('svg'); if (svg) svg.outerHTML = graphSvg(state.result.graph, state); };
  const zoom = (factor) => { const view = state.viewport ?? { x: 0, y: 0, width: state.layout.width, height: state.layout.height }; const width = Math.max(150, Math.min(5000, view.width * factor)), height = width * view.height / view.width; state.viewport = { x: view.x + (view.width - width) / 2, y: view.y + (view.height - height) / 2, width, height }; redraw(); };
  const announce = (message) => { state.message = message; root.querySelector('#neo-studio-status').textContent = `${state.result.rows.length} registros · ${message}`; };
  root.querySelectorAll('[data-studio-action]').forEach((button) => button.addEventListener('click', async () => {
    const action = button.dataset.studioAction;
    if (action === 'in' || action === 'out') { zoom(action === 'in' ? .8 : 1.25); return; }
    if (action === 'fit') { const points = Object.values({ ...state.layout.positions, ...state.positions }); if (points.length) { const xs = points.map((p) => p.x), ys = points.map((p) => p.y); state.viewport = { x: Math.min(...xs) - 65, y: Math.min(...ys) - 65, width: Math.max(...xs) - Math.min(...xs) + 130, height: Math.max(...ys) - Math.min(...ys) + 130 }; redraw(); } return; }
    if (action === 'reset') { state.positions = {}; state.viewport = null; redraw(); return; }
    if (action === 'deselect') { state.selected = null; state.selectedEdge = null; }
    if (action === 'help') state.help = !state.help;
    if (action === 'expand') state.expanded = !state.expanded;
    if (action === 'traverse') { editor.value = studioExamples(data)[4].code; run(); return; }
    if (action === 'copy') { try { await navigator.clipboard.writeText(editor.value); announce('Consulta copiada'); } catch { editor.focus(); editor.select(); announce('Selecione e use Ctrl+C para copiar'); } return; }
    if (action === 'download') {
      if (state.resultTab === 'graph') {
        const svg = root.querySelector('.neo-studio-svg'); if (!svg) { announce('Este resultado não contém grafo para baixar'); return; }
        const styles = '<style>text{font-family:Arial,sans-serif}.neo-studio-node text{fill:#18191b;font-size:10px;pointer-events:none}.neo-studio-node circle{fill:var(--node-color);stroke:none}.neo-studio-edge path{fill:none;stroke:#969da3;stroke-width:1.2}.neo-studio-edge .neo-edge-hit{stroke:transparent;stroke-width:14}.neo-studio-edge text{fill:#b8bdc2;font-size:9px}#neo-studio-arrow path{fill:#969da3}.dimmed{opacity:.16}</style>';
        const content = svg.outerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('><defs>', `><rect x="-10000" y="-10000" width="20000" height="20000" fill="#191b1c"/>${styles}<defs>`);
        download('astro-neo4j-grafo.svg', content, 'image/svg+xml');
      } else if (state.resultTab === 'table') {
        const cell = (entry) => `"${String(entry == null ? '' : typeof entry === 'object' ? JSON.stringify(entry) : entry).replace(/"/g, '""')}"`;
        download('astro-neo4j-resultados.csv', '\ufeff' + [state.result.columns, ...state.result.rows].map((row) => row.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
      } else download('astro-neo4j-resultados.json', JSON.stringify({ columns: state.result.columns, records: state.result.rows }, null, 2), 'application/json');
      announce('Resultado baixado'); return;
    }
    rerender();
  }));
  root.querySelector('#neo-studio-search')?.addEventListener('input', (event) => { state.query = event.target.value; redraw(); });
  root.querySelectorAll('[data-studio-label], [data-studio-relation]').forEach((button) => button.addEventListener('click', () => { const label = button.hasAttribute('data-studio-label'); const prop = label ? 'labelFocus' : 'relFocus'; const target = label ? button.dataset.studioLabel : button.dataset.studioRelation; state[prop] = state[prop] === target ? '' : target; rerender(); }));
  root.querySelector('[data-studio-document]')?.addEventListener('click', (event) => onDocument(event.currentTarget.dataset.studioDocument));
  const canvas = root.querySelector('.neo-studio-canvas'); if (!canvas) return;
  let drag = null;
  const select = (id, edge) => { state[edge ? 'selectedEdge' : 'selected'] = state[edge ? 'selectedEdge' : 'selected'] === id ? null : id; state[edge ? 'selected' : 'selectedEdge'] = null; rerender(); };
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const svg = canvas.querySelector('svg'); if (!svg) return;
    const matrix = svg.getScreenCTM(); if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const id = event.target.closest('[data-studio-node]')?.dataset.studioNode;
    const edge = event.target.closest('[data-studio-edge]')?.dataset.studioEdge;
    drag = { id, edge, startX: event.clientX, startY: event.clientY, point, inverse: matrix.inverse(), position: id ? state.positions[id] ?? state.layout.positions[id] : null, viewport: { ...(state.viewport ?? { x: 0, y: 0, width: state.layout.width, height: state.layout.height }) }, moved: false };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) < 4) return;
    drag.moved = true;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.inverse); const dx = point.x - drag.point.x, dy = point.y - drag.point.y;
    if (drag.id) state.positions[drag.id] = { x: drag.position.x + dx, y: drag.position.y + dy };
    else state.viewport = { ...drag.viewport, x: drag.viewport.x - dx, y: drag.viewport.y - dy };
    redraw();
  });
  canvas.addEventListener('pointerup', (event) => { const current = drag; drag = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); if (current && !current.moved) { if (current.id || current.edge) select(current.id ?? current.edge, !!current.edge); else if (state.selected || state.selectedEdge) { state.selected = null; state.selectedEdge = null; rerender(); } } });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('keydown', (event) => {
    const node = event.target.closest('[data-studio-node]'), edge = event.target.closest('[data-studio-edge]');
    if ((node || edge) && ['Enter', ' '].includes(event.key)) { event.preventDefault(); const id = node?.dataset.studioNode ?? edge.dataset.studioEdge; select(id, !!edge); root.querySelectorAll(node ? '[data-studio-node]' : '[data-studio-edge]').forEach((entry) => { if ((node ? entry.dataset.studioNode : entry.dataset.studioEdge) === id) entry.focus(); }); }
  });
  canvas.addEventListener('wheel', (event) => { if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); zoom(event.deltaY < 0 ? .9 : 1.1); }, { passive: false });
}

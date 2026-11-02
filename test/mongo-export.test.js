import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeMongo } from '../analyzer/mongo/index.js';
import { mongoGraph } from '../site/components/mongo/mongo-model.js';
import { compactGraph, exportGroups, exportLayout, exportPages, exportSvg, exportZip } from '../site/components/mongo/mongo-export.js';

test('modelo compacto reduz a área e inclui cada campo uma vez, preservando todos os blocos e relações', async () => {
  const data = await analyzeMongo({ write: false }); const graph = mongoGraph(data.collections);
  const before = JSON.stringify(graph); const compact = compactGraph(graph);
  const allFields = data.collections.flatMap(collection => collection.fields.map(field => `${collection.name}:${field.name}`)).sort();
  const compactFields = compact.nodes.flatMap(node => node.fields.map(field => `${node.collection.name}:${field.name}`)).sort();
  assert.deepEqual(compactFields, allFields);
  assert.equal(new Set(compactFields).size, compactFields.length);
  assert.deepEqual(compact.edges, graph.edges);
  assert.deepEqual(compact.nodes.map(node => node.id), graph.nodes.map(node => node.id));
  assert.equal(JSON.stringify(graph), before);
  const full = exportLayout(graph); const small = exportLayout(graph, undefined, true);
  assert.ok(small.width * small.height < full.width * full.height * .75);
  assert.ok(small.height < full.height * .6);
  const boxes = Object.values(small.positions);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]; const b = boxes[j];
    assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  }
  let nodes = 0; let edges = 0; let fields = 0;
  const pages = exportPages(small, true);
  for (const [index, page] of pages.entries()) {
    for (const group of page.groups) for (const node of group.nodes) {
      const p = small.positions[node.id]; assert.ok(p.y >= page.top && p.y + p.height <= page.bottom);
    }
    const file = exportSvg(small, page, index, pages.length);
    nodes += file.nodeCount; edges += file.edgeCount;
    fields += (file.svg.match(/data-export-field=/g) ?? []).length;
  }
  assert.equal(nodes, graph.nodes.length); assert.equal(edges, graph.edges.length); assert.equal(fields, allFields.length);
});

test('exportação completa preserva todos os blocos, campos e relações sem truncar nomes', async () => {
  const data = await analyzeMongo({ write: false }); const graph = mongoGraph(data.collections);
  const before = JSON.stringify(graph);
  const layout = exportLayout(graph); const pages = exportPages(layout, false);
  const file = exportSvg(layout, pages[0]);
  assert.equal(file.nodeCount, graph.nodes.length); assert.equal(file.edgeCount, graph.edges.length);
  assert.equal((file.svg.match(/data-export-node=/g) ?? []).length, graph.nodes.length);
  assert.equal((file.svg.match(/data-export-edge=/g) ?? []).length, graph.edges.length);
  assert.doesNotMatch(file.svg, /…|foreignObject|<script|var\(--|https?:\/\/(?!www.w3.org)/);
  for (const node of graph.nodes) {
    const box = layout.positions[node.id];
    assert.ok(box.x >= 0 && box.y >= 0);
    assert.ok(box.x + box.width <= layout.width && box.y + box.height <= layout.height);
    if (node.fields.length) assert.ok(88 + (node.fields.length - 1) * 26 < box.height);
  }
  assert.equal(JSON.stringify(graph), before);
});

test('paginação cobre cada entidade e relação uma vez e mantém grupos conectados inteiros', async () => {
  const graph = mongoGraph((await analyzeMongo({ write: false })).collections);
  const layout = exportLayout(graph); const pages = exportPages(layout, true);
  assert.ok(pages.length > 1);
  const seen = new Set(); let edgeCount = 0;
  for (const [index, page] of pages.entries()) {
    const ids = new Set(page.groups.flatMap(group => group.nodes.map(node => node.id)));
    for (const id of ids) { assert.ok(!seen.has(id)); seen.add(id); const box = layout.positions[id]; assert.ok(box.y >= page.top && box.y + box.height <= page.bottom); }
    for (const edge of page.groups.flatMap(group => group.edges)) { assert.ok(ids.has(edge.from) && ids.has(edge.to)); edgeCount++; }
    const file = exportSvg(layout, page, index, pages.length);
    assert.match(file.svg, new RegExp(`Página ${index + 1} de ${pages.length}`));
  }
  assert.equal(seen.size, graph.nodes.length); assert.equal(edgeCount, graph.edges.length);
});

test('nomes longos ampliam os cards e conteúdo é escapado', () => {
  const collection = { name: '<colecao>', fields: [{ name: 'campo_muito_longo_'.repeat(12), type: '<string>' }] };
  const graph = mongoGraph([collection]); const layout = exportLayout(graph);
  assert.ok(layout.positions['<colecao>'].width > 1500);
  const file = exportSvg(layout, exportPages(layout, false)[0]);
  assert.match(file.svg, /&lt;colecao&gt;/); assert.match(file.svg, /&lt;string&gt;/);
  assert.ok(file.svg.includes(collection.fields[0].name));
});

test('catálogo vazio não gera páginas e grupos gigantes não são cortados', () => {
  assert.deepEqual(exportPages(exportLayout({ nodes: [], edges: [] }), true), []);
  const graph = mongoGraph([{ name: 'alto', fields: Array.from({ length: 300 }, (_, i) => ({ name: `campo_${i}`, type: 'string' })) }]);
  const pages = exportPages(exportLayout(graph), true, 500);
  assert.equal(pages.length, 1); assert.ok(pages[0].bottom - pages[0].top > 500);
  assert.equal(exportGroups(graph).length, 1);
});

test('ZIP contém arquivos numerados com diretório e CRC válidos', async () => {
  const blob = await exportZip([{ name: 'pagina-01.svg', blob: new Blob(['123456789']) }, { name: 'pagina-02.svg', blob: new Blob(['segunda']) }]);
  const bytes = new Uint8Array(await blob.arrayBuffer()); const view = new DataView(bytes.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(14, true), 0xcbf43926);
  assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(bytes.length - 12, true), 2);
  const directoryOffset = view.getUint32(bytes.length - 6, true);
  assert.equal(view.getUint32(directoryOffset, true), 0x02014b50);
});

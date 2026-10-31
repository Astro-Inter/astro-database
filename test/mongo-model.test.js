import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeMongo } from '../analyzer/mongo/index.js';
import { createMongoModelState, mongoGraph, mongoModelLayout, mongoModelView } from '../site/components/mongo/mongo-model.js';

test('modelagem deriva documentos embutidos dos campos sem inventar referências por IDs', async () => {
  const data = await analyzeMongo({ write: false });
  const graph = mongoGraph(data.collections);
  assert.deepEqual(graph.nodes.filter(node => node.type === 'collection').map(node => node.id).sort(), data.collections.map(collection => collection.name).sort());
  assert.ok(graph.nodes.some(node => node.id === 'configuracoes_paineis'));
  assert.ok(graph.edges.some(edge => edge.from === 'configuracoes_paineis' && edge.to === 'configuracoes_paineis::configuracao'));
  assert.ok(graph.edges.some((edge) => edge.from === 'sessoes' && edge.to === 'sessoes::mensagens'));
  assert.ok(graph.edges.some((edge) => edge.from === 'formularios' && edge.to === 'formularios::perguntas'));
  assert.ok(graph.edges.some((edge) => edge.type === 'reference' && edge.from === 'mensagens' && edge.to === 'conversas'));
  const layout = mongoModelLayout(graph);
  for (const node of graph.nodes) assert.ok(layout.positions[node.id]);
});

test('referências explícitas só ligam collections existentes', () => {
  const collections = [{ name: 'a', fields: [{ name: 'b_id', type: 'number', references: 'b' }, { name: 'externo_id', type: 'number', references: 'externo' }] }, { name: 'b', fields: [] }];
  assert.deepEqual(mongoGraph(collections).edges, [{ from: 'a', to: 'b', label: 'b_id', type: 'reference' }]);
});

test('modelagem escapa conteúdo e suporta catálogo vazio', () => {
  const data = { collections: [{ name: '<script>', description: '<unsafe>', fields: [] }] };
  const markup = mongoModelView(data, createMongoModelState());
  assert.doesNotMatch(markup, /<script>/);
  assert.match(markup, /&lt;script&gt;/);
  assert.match(mongoModelView({ collections: [] }, createMongoModelState()), /Nenhuma collection documentada/);
});

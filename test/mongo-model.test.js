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

test('objetos e listas aninhados pertencem ao documento imediatamente superior', async () => {
  const data = await analyzeMongo({ write: false });
  const graph = mongoGraph(data.collections);
  for (const [from, to] of [
    ['formularios::perguntas', 'formularios::perguntas[].opcoes'],
    ['formularios::perguntas', 'formularios::perguntas[].resposta'],
    ['configuracoes_paineis::configuracao', 'configuracoes_paineis::configuracao.graficos'],
    ['configuracoes_paineis::configuracao.graficos', 'configuracoes_paineis::configuracao.graficos[].consulta'],
  ]) assert.ok(graph.edges.some(edge => edge.from === from && edge.to === to && edge.type === 'embedded'), `${from} → ${to}`);
  const perguntas = graph.nodes.find(node => node.id === 'formularios::perguntas');
  assert.ok(perguntas.fields.some(field => field.name === 'perguntas[].opcoes'));
  assert.ok(!perguntas.fields.some(field => field.name === 'perguntas[].opcoes[].texto'));
  const allFields = graph.nodes.filter(node => node.collection.name === 'formularios').flatMap(node => node.fields);
  assert.equal(allFields.length, data.collections.find(collection => collection.name === 'formularios').fields.length);
  assert.equal(new Set(allFields.map(field => field.name)).size, allFields.length);
});

test('visão conceitual mantém referências e estrutura limita a coleção explorada', async () => {
  const data = await analyzeMongo({ write: false });
  const state = createMongoModelState();
  const conceptual = mongoModelView(data, state);
  assert.equal((conceptual.match(/data-mongo-node=/g) ?? []).length, data.collections.length);
  assert.match(conceptual, /conversa_id/);
  assert.match(conceptual, /resposta_mensagem_id/);
  assert.doesNotMatch(conceptual, /data-mongo-node="formularios::/);
  const structure = mongoModelView(data, { ...state, view: 'structure', scope: 'formularios' });
  assert.match(structure, /data-mongo-node="formularios::perguntas\[\]\.opcoes"/);
  assert.doesNotMatch(structure, /data-mongo-node="sessoes/);
});

test('layout mantém cards separados e campos dentro dos limites do documento', async () => {
  const data = await analyzeMongo({ write: false });
  const graph = mongoGraph(data.collections);
  const layout = mongoModelLayout(graph);
  const boxes = Object.values(layout.positions);
  for (const node of graph.nodes) if (node.fields.length) assert.ok(layout.positions[node.id].height >= 88 + (node.fields.length - 1) * 28);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]; const b = boxes[j];
    assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  }
});

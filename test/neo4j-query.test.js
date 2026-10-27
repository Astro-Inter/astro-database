import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeNeo4j } from '../analyzer/neo4j/index.js';
import { executeCypher } from '../site/components/neo4j/neo4j-query.js';
import { studioExamples, highlightCypher, studioView, studioLayout } from '../site/components/neo4j/neo4j-studio.js';
import { createNeo4jModelState } from '../site/components/neo4j/neo4j-model.js';

const data = await analyzeNeo4j({ write: false });
const run = (code) => executeCypher(data.graph, code);

test('consulta da referência retorna exatamente os 7 nós e 8 vínculos PARTICIPA', () => {
  const result = run('MATCH p=()-[:PARTICIPA]->() RETURN p;');
  assert.equal(result.rows.length, 8);
  assert.equal(result.graph.nodes.length, 7);
  assert.equal(result.graph.edges.length, 8);
  assert.equal(result.graph.nodes.filter((node) => node.label === 'Colaborador').length, 5);
  assert.ok(result.graph.edges.every((edge) => edge.type === 'PARTICIPA'));
  assert.deepEqual(result.graph.nodes.filter((node) => node.label === 'GrupoTreinamento').map((node) => node.properties.grupo_nr).sort(), [10, 35]);
});

test('executa o traversal original do documento e os demais exemplos sem reconhecer texto fixo', () => {
  const result = run(data.scripts.find((script) => script.kind === 'query').code);
  assert.deepEqual(result.columns, ['colaborador', 'cargo', 'grupo', 'data_treinamento']);
  assert.deepEqual(result.rows.map((row) => row[0]), ['João Silva', 'Maria Souza', 'Pedro Lima', 'Lucas Oliveira', 'Fernanda Costa']);
  assert.ok(result.rows.every((row) => row[3] === '2026-08-15'));
  assert.equal(result.graph.nodes.length, 0);
  for (const example of studioExamples(data)) assert.doesNotThrow(() => run(example.code));
  assert.equal(run('match /* caminho completo */ p = () --> () return p').graph.edges.length, 59);
  assert.equal(run('MATCH (n) RETURN n').graph.nodes.length, 66);
});

test('consulta NR-10 inicial exibe em Table os mesmos cinco registros fornecidos pelo usuário', () => {
  const state = createNeo4jModelState();
  state.cypher = `MATCH (c:Colaborador)-[:PARTICIPA]->(g:GrupoTreinamento)
      -[:POSSUI]->(e:Evento)-[:REALIZA]->(t:Treinamento)
WHERE t.nome = 'NR-10 Básico'
RETURN c.nome AS colaborador,
       c.cargo AS cargo,
       g.titulo AS grupo,
       e.data_evento AS data_treinamento;`;
  const html = studioView(data, state);
  const group = 'Segurança em Instalações e Serviços em Eletricidade';
  assert.deepEqual(state.result.columns, ['colaborador', 'cargo', 'grupo', 'data_treinamento']);
  assert.deepEqual(state.result.rows, [
    ['João Silva', 'Operador de Máquina', group, '2026-08-15'],
    ['Maria Souza', 'Eletricista Industrial', group, '2026-08-15'],
    ['Pedro Lima', 'Operador de Empilhadeira', group, '2026-08-15'],
    ['Lucas Oliveira', 'Soldador', group, '2026-08-15'],
    ['Fernanda Costa', 'Técnica em Segurança do Trabalho', group, '2026-08-15']
  ]);
  assert.equal(state.executed, state.cypher);
  assert.equal(state.resultTab, 'table');
  assert.match(html, /role="tabpanel" aria-labelledby="neo-result-tab-table"/);
  for (const row of state.result.rows) for (const cell of row) assert.ok(html.includes(cell));
  assert.match(html, /5 registros/);
});

test('respeita filtros livres, labels, literais, acentos, aliases e ordem numérica', () => {
  const filtered = run("MATCH (c:Colaborador) WHERE (c.id_colaborador >= 10 AND c.nome CONTAINS 'a') OR c.nome = 'João Silva' RETURN c.id_colaborador AS id, c.nome AS nome ORDER BY id DESC SKIP 1 LIMIT 2");
  assert.deepEqual(filtered.rows, [[14, 'Diego Pereira'], [13, 'Camila Ribeiro']]);
  assert.deepEqual(run("MATCH (c:Colaborador {nome:'Maria Souza'}) RETURN c.cargo").rows, [['Eletricista Industrial']]);
  assert.deepEqual(run("MATCH (e:Evento) WHERE e.data_evento >= date('2026-10-01') RETURN e.id_evento ORDER BY e.id_evento").rows, [[8], [9], [10], [11], [12]]);
  assert.deepEqual(run('MATCH (c:Colaborador) WHERE c.id_colaborador IN [1, 3] RETURN c.id_colaborador').rows, [[1], [3]]);
  assert.equal(run("MATCH (c:Colaborador) WHERE toLower(c.nome) STARTS WITH 'maria' RETURN c").rows.length, 1);
});

test('respeita direção, variáveis compartilhadas e não inventa conexões ao retornar nós', () => {
  assert.equal(run('MATCH (g:GrupoTreinamento)<-[r:PARTICIPA]-(c:Colaborador) RETURN c,r,g').rows.length, 8);
  assert.equal(run('MATCH (g:GrupoTreinamento)-[:PARTICIPA]->(c:Colaborador) RETURN c').rows.length, 0);
  assert.equal(run('MATCH (g:GrupoTreinamento)-[:PARTICIPA]-(c:Colaborador) RETURN c').rows.length, 8);
  assert.equal(run('MATCH (c:Colaborador {id_colaborador:1}) MATCH (c)-[:PARTICIPA]->(g) RETURN g').rows.length, 1);
  assert.deepEqual(run('MATCH (g:GrupoTreinamento) MATCH (e:Evento) WHERE g.id_grupo = e.id_evento RETURN count(*)').rows, [[12]]);
  assert.equal(run('MATCH (c)-[:PARTICIPA]->(g) RETURN c,g').graph.edges.length, 0);
  const edge = run('MATCH ()-[r:PARTICIPA]->() RETURN r LIMIT 1');
  assert.equal(edge.graph.nodes.length, 2);
  assert.equal(edge.graph.edges.length, 1);
});

test('count, DISTINCT, agrupamentos, null e limites mantêm a semântica de leitura', () => {
  assert.deepEqual(run('MATCH (c)-[:PARTICIPA]->(g) RETURN count(c), count(DISTINCT c)').rows, [[8, 5]]);
  assert.equal(run('MATCH (c)-[:PARTICIPA]->(g) RETURN DISTINCT c').rows.length, 5);
  assert.deepEqual(run('MATCH (c)-[:PARTICIPA]->(g) RETURN g.grupo_nr AS nr, count(c) AS total ORDER BY total DESC').rows, [[10, 5], [35, 3]]);
  assert.deepEqual(run("MATCH (c:Colaborador {nome:'inexistente'}) RETURN count(*)").rows, [[0]]);
  assert.equal(run('MATCH (c:Colaborador) WHERE NOT c.ausente = 1 RETURN c').rows.length, 0);
  assert.equal(run('MATCH (c:Colaborador) WHERE c.ausente IS NULL RETURN c').rows.length, 15);
  assert.equal(run('MATCH (c:Colaborador) WHERE c.ausente IS NOT NULL RETURN c').rows.length, 0);
  assert.equal(run('MATCH (n) RETURN n LIMIT 0').rows.length, 0);
  assert.equal(run('MATCH (n) RETURN n.ausente').rows[0][0], null);
});

test('retorna erro explícito para escrita, sintaxe incompleta, variáveis ausentes e consultas excessivas', () => {
  const before = JSON.stringify(data.graph);
  for (const code of [
    'CREATE (n:Colaborador)', 'MATCH (n) DELETE n', 'MATCH (n) RETURN x',
    'MATCH (n) RETURN n; MATCH (m) RETURN m', 'MATCH (n RETURN n',
    'MATCH p=()-[:PARTICIPA*1..3]->() RETURN p', 'MATCH (n) RETURN n LIMIT -1',
    "MATCH (n) WHERE n.nome = date('2026-02-30') RETURN n", 'MATCH (n) RETURN eval(n)',
    'MATCH (n) RETURN n UNION MATCH (m) RETURN m', 'MATCH (n),(m),(o) RETURN n',
    "MATCH (n) WHERE n.nome = 'inexistente' RETURN x", 'MATCH (n) RETURN n AS x,n AS x'
  ]) assert.throws(() => run(code), Error, code);
  assert.equal(JSON.stringify(data.graph), before);
});

test('textos com comandos são dados; conteúdo HTML é escapado nas três visualizações', () => {
  assert.equal(run("MATCH (c:Colaborador) WHERE c.nome = 'DELETE MATCH RETURN' RETURN c").rows.length, 0);
  const unsafe = structuredClone(data);
  unsafe.graph.nodes.find((node) => node.label === 'Colaborador').properties.nome = '<img src=x onerror=alert(1)>';
  const state = createNeo4jModelState();
  for (const tab of ['graph', 'table', 'raw']) {
    state.resultTab = tab;
    const html = studioView(unsafe, state);
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;img/);
  }
  assert.doesNotMatch(highlightCypher('RETURN "<script>"'), /<script>/);
});

test('layout é determinístico e atribui posições finitas a todos os nós retornados', () => {
  const graph = run('MATCH p=()-->() RETURN p').graph;
  const layout = studioLayout(graph);
  assert.deepEqual(layout, studioLayout(graph));
  for (const node of graph.nodes) { const point = layout.positions[node.id]; assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y)); }
});

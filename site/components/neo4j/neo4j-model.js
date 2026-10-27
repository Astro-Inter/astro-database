import { studioView, mountStudio, participationQuery } from './neo4j-studio.js';

export const nodeColors = { Unidade: '#156b91', Colaborador: '#167563', GrupoTreinamento: '#8050ac', Evento: '#b76027', Treinamento: '#245ec2', Certificado: '#9d4070' };
const columns = ['Unidade', 'Colaborador', 'GrupoTreinamento', 'Evento', 'Treinamento', 'Certificado'];

export function createNeo4jModelState() {
  return { cypher: participationQuery, resultTab: 'graph', result: null, history: [], error: null, viewport: null, layout: null, view: 'schema', unit: '', label: '', query: '', selected: null, positions: {}, zoom: 1, fit: true, scroll: { left: 0, top: 0 }, traversal: false };
}

export function schemaGraph(data) {
  return {
    nodes: data.labels.map((label) => ({ id: label.name, label: label.name, properties: {}, schema: true })),
    edges: data.relationships.map((edge) => ({ id: edge.type, from: edge.from, to: edge.to, type: edge.type }))
  };
}

/** Percorre somente as relações declaradas; IDs iguais não criam vínculos. */
export function traverseTraining(graph, training = 'NR-10 Básico') {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = (id, type) => graph.edges.filter((edge) => edge.from === id && edge.type === type);
  const paths = [];
  for (const collaborator of graph.nodes.filter((node) => node.label === 'Colaborador')) {
    for (const participation of outgoing(collaborator.id, 'PARTICIPA')) {
      for (const eventEdge of outgoing(participation.to, 'POSSUI')) {
        for (const trainingEdge of outgoing(eventEdge.to, 'REALIZA')) {
          if (nodes.get(trainingEdge.to)?.properties.nome !== training) continue;
          paths.push({ nodes: [collaborator.id, participation.to, eventEdge.to, trainingEdge.to], edges: [participation.id, eventEdge.id, trainingEdge.id], row: {
            colaborador: collaborator.properties.nome, cargo: collaborator.properties.cargo,
            grupo: nodes.get(participation.to).properties.titulo, data_treinamento: nodes.get(eventEdge.to).properties.data_evento
          } });
        }
      }
    }
  }
  return paths;
}

export function visibleGraph(data, state) {
  const graph = state.view === 'schema' ? schemaGraph(data) : data.graph;
  let allowed = new Set(graph.nodes.map((node) => node.id));
  if (state.view === 'sample' && state.traversal) allowed = new Set(traverseTraining(graph).flatMap((entry) => entry.nodes));
  else if (state.view === 'sample' && state.unit) {
    allowed = new Set([state.unit]);
    graph.edges.filter((edge) => edge.type === 'PERTENCE' && edge.to === state.unit).forEach((edge) => allowed.add(edge.from));
    for (const type of ['PARTICIPA', 'POSSUI', 'REALIZA', 'RECEBE']) {
      graph.edges.filter((edge) => edge.type === type && allowed.has(edge.from)).forEach((edge) => allowed.add(edge.to));
    }
  }
  const nodes = graph.nodes.filter((node) => allowed.has(node.id) && (!state.label || node.label === state.label));
  const ids = new Set(nodes.map((node) => node.id));
  return { nodes, edges: graph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)) };
}

export function graphLayout(graph, view) {
  const positions = {};
  if (view === 'schema') {
    const points = { Unidade: [130, 90], Colaborador: [130, 320], GrupoTreinamento: [385, 320], Evento: [640, 320], Treinamento: [895, 320], Certificado: [895, 90] };
    graph.nodes.forEach((node) => { const [x, y] = points[node.label]; positions[node.id] = { x, y }; });
    return { positions, width: 1040, height: 450 };
  }
  let maxY = 360;
  const visibleColumns = columns.filter((label) => graph.nodes.some((node) => node.label === label));
  for (const [column, label] of visibleColumns.entries()) {
    const nodes = graph.nodes.filter((node) => node.label === label);
    for (const [index, node] of nodes.entries()) {
      const y = 100 + index * 145;
      positions[node.id] = { x: 120 + column * 255, y };
      maxY = Math.max(maxY, y + 110);
    }
  }
  // Centraliza os nós de uma coluna quando há menos instâncias que na anterior.
  for (const label of visibleColumns.slice(1)) {
    for (const node of graph.nodes.filter((entry) => entry.label === label)) {
      const previous = graph.edges.filter((edge) => edge.to === node.id && positions[edge.from]?.x < positions[node.id].x).map((edge) => positions[edge.from].y);
      if (previous.length) positions[node.id].y = previous.reduce((sum, y) => sum + y, 0) / previous.length;
    }
  }
  return { positions, width: Math.max(420, visibleColumns.length * 255 + 10), height: maxY };
}

export const neo4jModelView = studioView;
export const mountNeo4jModel = mountStudio;

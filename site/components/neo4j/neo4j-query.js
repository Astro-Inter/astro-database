// Interpretador de leitura da prévia estática. Não usa eval, rede ou credenciais.
// A gramática é intencionalmente limitada; entradas desconhecidas são rejeitadas.
const MAX_ROWS = 10000;
const key = (value) => JSON.stringify(value);

function tokenize(source) {
  if (source.length > 20000) throw new Error('Consulta muito longa. Use até 20.000 caracteres.');
  const tokens = [];
  const pattern = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:``|[^`])*`|\d+(?:\.\d+)?|[A-Za-z_][\w]*|<>|!=|<=|>=|<-|->|[()[\]{},.:;=<>*|+-]/gy;
  let offset = 0;
  while (offset < source.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (!match) throw new Error(`Caractere não suportado na posição ${offset + 1}: ${source[offset]}.`);
    offset = pattern.lastIndex;
    const text = match[0];
    if (/^\s|^\/\//.test(text) || text.startsWith('/*')) continue;
    const quoted = /^['"`]/.test(text);
    tokens.push({ text, upper: quoted ? text : text.toUpperCase(), quoted });
  }
  return tokens;
}

function parse(source) {
  const tokens = tokenize(source);
  let cursor = 0;
  const variables = new Set();
  const peek = (value) => tokens[cursor]?.upper === value;
  const take = (value) => { if (peek(value)) { cursor++; return true; } return false; };
  const require = (value) => { if (!take(value)) throw new Error(`Esperado « ${value} » próximo de « ${tokens[cursor]?.text ?? 'fim da consulta'} ».`); };
  const identifier = () => {
    const token = tokens[cursor++];
    if (!token || !/^(?:[A-Za-z_]\w*|`(?:``|[^`])+`)$/.test(token.text)) throw new Error('Esperado um nome de variável, label ou propriedade.');
    return token.text.startsWith('`') ? token.text.slice(1, -1).replace(/``/g, '`') : token.text;
  };
  const literal = () => {
    const negative = take('-');
    const token = tokens[cursor++];
    if (!token) throw new Error('Informe um valor para a comparação.');
    if (/^\d/.test(token.text)) return (negative ? -1 : 1) * Number(token.text);
    if (negative) throw new Error('O sinal negativo exige um número.');
    if (/^['"]/.test(token.text)) return token.text.slice(1, -1).replace(/\\([\\'"nrt])/g, (_, ch) => ({ n: '\n', r: '\r', t: '\t' }[ch] ?? ch));
    if (token.upper === 'TRUE') return true;
    if (token.upper === 'FALSE') return false;
    if (token.upper === 'NULL') return null;
    if (token.upper === 'DATE') { require('('); const value = literal(); require(')'); if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Use date(\'AAAA-MM-DD\') com uma data válida.'); return value; }
    throw new Error(`Valor não suportado: ${token.text}. Use texto entre aspas, número, booleano, null ou date().`);
  };
  function expression(allowCount = false) {
    if (take('[')) { const values = []; if (!peek(']')) { do { values.push(expression()); } while (take(',')); } require(']'); return { kind: 'list', values }; }
    const token = tokens[cursor];
    if (!token) throw new Error('Expressão incompleta.');
    if (token.quoted && !token.text.startsWith('`') || /^\d/.test(token.text) || ['-', 'TRUE', 'FALSE', 'NULL', 'DATE'].includes(token.upper)) return { kind: 'literal', value: literal() };
    const name = identifier();
    if (take('(')) {
      const fn = name.toLowerCase();
      if (!['count', 'labels', 'type', 'properties', 'tolower', 'toupper'].includes(fn) || fn === 'count' && !allowCount) throw new Error(`Função ${name}() não suportada nesta expressão.`);
      const distinct = fn === 'count' && take('DISTINCT');
      const arg = fn === 'count' && take('*') ? { kind: 'star' } : expression();
      require(')'); return { kind: fn === 'count' ? 'count' : 'function', fn, arg, distinct };
    }
    if (!variables.has(name)) throw new Error(`Variável « ${name} » não definida no MATCH.`);
    return take('.') ? { kind: 'property', variable: name, property: identifier() } : { kind: 'variable', name };
  }
  const properties = () => {
    const result = {};
    if (take('{')) { if (!peek('}')) { do { const name = identifier(); require(':'); result[name] = literal(); } while (take(',')); } require('}'); }
    return result;
  };
  function entity(close) {
    const variable = !peek(':') && !peek('{') && !peek(close) ? identifier() : null;
    if (variable) variables.add(variable);
    const label = take(':') ? identifier() : null;
    const props = properties(); require(close);
    return { variable, label, props };
  }
  function pattern() {
    let variable = null;
    if (!peek('(')) { variable = identifier(); require('='); if (variables.has(variable)) throw new Error('Use uma variável nova para cada caminho.'); variables.add(variable); }
    require('(');
    const nodes = [entity(')')]; const edges = [];
    while (peek('-') || peek('<-')) {
      const incoming = take('<-'); if (!incoming) require('-');
      let edge = { variable: null, label: null, props: {} };
      if (take('[')) edge = entity(']');
      const outgoing = take('->'); if (!outgoing) require('-');
      if (incoming && outgoing) throw new Error('O relacionamento deve ter uma única direção.');
      edges.push({ ...edge, direction: incoming ? 'in' : outgoing ? 'out' : 'both' });
      require('('); nodes.push(entity(')'));
    }
    return { variable, nodes, edges };
  }
  function condition() {
    function atom() {
      if (take('NOT')) return { op: 'not', left: atom() };
      if (take('(')) { const value = or(); require(')'); return value; }
      const left = expression();
      if (take('IS')) { const negative = take('NOT'); require('NULL'); return { op: negative ? 'notnull' : 'null', left }; }
      let op = tokens[cursor++]?.upper;
      if (op === 'STARTS' || op === 'ENDS') { require('WITH'); op += ' WITH'; }
      if (!['=', '<>', '!=', '<', '>', '<=', '>=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH', 'IN'].includes(op)) throw new Error('Use =, <>, <, >, <=, >=, CONTAINS, STARTS WITH, ENDS WITH, IN ou IS NULL no WHERE.');
      return { op, left, right: expression() };
    }
    function and() { let left = atom(); while (take('AND')) left = { op: 'and', left, right: atom() }; return left; }
    function or() { let left = and(); while (take('OR')) left = { op: 'or', left, right: and() }; return left; }
    return or();
  }
  const matches = [];
  if (!peek('MATCH')) throw new Error('Esta prévia aceita consultas de leitura começando com MATCH. A carga está em Scripts Cypher.');
  while (take('MATCH')) { const patterns = []; do { patterns.push(pattern()); } while (take(',')); const where = take('WHERE') ? condition() : null; matches.push({ patterns, where }); }
  require('RETURN'); const distinct = take('DISTINCT'); const returns = [];
  do {
    const start = cursor;
    const expr = take('*') ? { kind: 'star' } : expression(true);
    const title = tokens.slice(start, cursor).map((token) => token.text).join('').replace(/^count/i, 'count');
    const alias = take('AS') ? identifier() : title;
    if (expr.kind === 'star') { for (const name of variables) returns.push({ expr: { kind: 'variable', name }, alias: name }); }
    else returns.push({ expr, alias });
  } while (take(','));
  const orders = [];
  if (take('ORDER')) {
    require('BY');
    do {
      const start = cursor; let expr;
      const alias = tokens[cursor]?.text;
      if (returns.some((entry) => entry.alias === alias) && tokens[cursor + 1]?.text !== '.') { cursor++; expr = { kind: 'alias', name: alias }; }
      else expr = expression(true);
      const title = tokens.slice(start, cursor).map((token) => token.text).join('');
      const projected = returns.find((entry) => entry.alias === title);
      if (projected) expr = { kind: 'alias', name: title };
      if (expr.kind === 'count') throw new Error('Dê um alias ao count() e use esse alias no ORDER BY.');
      const desc = take('DESC'); if (!desc) take('ASC'); orders.push({ expr, desc });
    } while (take(','));
  }
  const integer = () => { const value = literal(); if (!Number.isSafeInteger(value) || value < 0) throw new Error('SKIP e LIMIT precisam de inteiros positivos ou zero.'); return value; };
  const skip = take('SKIP') ? integer() : 0;
  const limit = take('LIMIT') ? integer() : MAX_ROWS;
  take(';');
  if (cursor !== tokens.length) throw new Error(`Sintaxe não suportada próximo de « ${tokens[cursor].text} ». Consulte a ajuda de consultas desta prévia.`);
  if (new Set(returns.map((entry) => entry.alias)).size !== returns.length) throw new Error('Use aliases diferentes para as colunas do RETURN.');
  return { matches, returns, distinct, orders, skip, limit };
}

function value(expr, row) {
  if (expr.kind === 'literal') return expr.value;
  if (expr.kind === 'variable') return row[expr.name];
  if (expr.kind === 'property') return row[expr.variable]?.properties?.[expr.property] ?? null;
  if (expr.kind === 'list') return expr.values.map((entry) => value(entry, row));
  if (expr.kind === 'star') return 1;
  if (expr.kind === 'function') {
    const arg = value(expr.arg, row);
    if (arg == null) return null;
    if (expr.fn === 'labels') { if (!arg.label) throw new Error('labels() exige um nó.'); return [arg.label]; }
    if (expr.fn === 'type') { if (!arg.type) throw new Error('type() exige um relacionamento.'); return arg.type; }
    if (expr.fn === 'properties') { if (!arg.label && !arg.type) throw new Error('properties() exige um nó ou relacionamento.'); return arg.properties ?? {}; }
    if (typeof arg !== 'string') throw new Error(`${expr.fn}() exige texto.`);
    return expr.fn === 'tolower' ? arg.toLowerCase() : arg.toUpperCase();
  }
  throw new Error('Expressão não suportada.');
}

function predicate(expr, row) {
  if (expr.op === 'and' || expr.op === 'or') {
    const left = predicate(expr.left, row), right = predicate(expr.right, row);
    return expr.op === 'and' ? left === false || right === false ? false : left == null || right == null ? null : true
      : left === true || right === true ? true : left == null || right == null ? null : false;
  }
  if (expr.op === 'not') { const result = predicate(expr.left, row); return result == null ? null : !result; }
  const left = value(expr.left, row);
  if (expr.op === 'null') return left == null;
  if (expr.op === 'notnull') return left != null;
  const right = value(expr.right, row);
  if (left == null || right == null) return null;
  if (expr.op === 'IN') {
    if (!Array.isArray(right)) throw new Error('IN exige uma lista à direita.');
    return right.some((entry) => key(entry) === key(left)) ? true : right.includes(null) ? null : false;
  }
  if (['CONTAINS', 'STARTS WITH', 'ENDS WITH'].includes(expr.op)) {
    if (typeof left !== 'string' || typeof right !== 'string') throw new Error(`${expr.op} exige dois textos.`);
    return expr.op === 'CONTAINS' ? left.includes(right) : expr.op === 'STARTS WITH' ? left.startsWith(right) : left.endsWith(right);
  }
  if (expr.op === '=') return key(left) === key(right);
  if (expr.op === '<>' || expr.op === '!=') return key(left) !== key(right);
  if (typeof left !== typeof right) return false;
  return expr.op === '<' ? left < right : expr.op === '>' ? left > right : expr.op === '<=' ? left <= right : left >= right;
}

function expand(pattern, row, graph, budget) {
  const results = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const fits = (spec, entity, bindings) => (!spec.label || (entity.label ?? entity.type) === spec.label)
    && (!spec.variable || !Object.hasOwn(bindings, spec.variable) || bindings[spec.variable] === entity)
    && Object.entries(spec.props).every(([property, expected]) => expected != null && entity.properties?.[property] === expected);
  const bind = (spec, entity, bindings) => spec.variable ? { ...bindings, [spec.variable]: entity } : bindings;
  function walk(index, node, bindings, nodes, edges) {
    if (++budget.visits > 200000) throw new Error('Consulta muito ampla para a prévia. Restrinja os labels ou propriedades no MATCH.');
    if (index === pattern.edges.length) {
      if (results.length >= MAX_ROWS) throw new Error('A consulta excede 10.000 combinações. Restrinja o MATCH ou WHERE.');
      results.push(pattern.variable ? { ...bindings, [pattern.variable]: { nodes, edges } } : bindings); return;
    }
    const spec = pattern.edges[index];
    for (const edge of graph.edges) {
      if (edges.includes(edge) || !fits(spec, edge, bindings)) continue;
      const targets = [];
      if (spec.direction !== 'in' && edge.from === node.id) targets.push(edge.to);
      if (spec.direction !== 'out' && edge.to === node.id && (edge.from !== edge.to || !targets.length)) targets.push(edge.from);
      for (const id of targets) {
        const next = byId.get(id); const nextBindings = bind(spec, edge, bindings);
        if (next && fits(pattern.nodes[index + 1], next, nextBindings)) walk(index + 1, next, bind(pattern.nodes[index + 1], next, nextBindings), [...nodes, next], [...edges, edge]);
      }
    }
  }
  for (const node of graph.nodes) if (fits(pattern.nodes[0], node, row)) walk(0, node, bind(pattern.nodes[0], node, row), [node], []);
  return results;
}

export function executeCypher(graph, source) {
  const ast = parse(source);
  let bindings = [{}]; const budget = { visits: 0 };
  for (const match of ast.matches) {
    for (const pattern of match.patterns) {
      const next = [];
      for (const row of bindings) {
        next.push(...expand(pattern, row, graph, budget));
        if (next.length > MAX_ROWS) throw new Error('A consulta excede 10.000 combinações. Restrinja o MATCH.');
      }
      bindings = next;
    }
    if (match.where) bindings = bindings.filter((row) => predicate(match.where, row) === true);
  }
  const aggregates = ast.returns.some((entry) => entry.expr.kind === 'count');
  let entries;
  if (aggregates) {
    const grouping = ast.returns.filter((entry) => entry.expr.kind !== 'count');
    const groups = new Map();
    for (const row of bindings) { const id = key(grouping.map((entry) => value(entry.expr, row))); if (!groups.has(id)) groups.set(id, []); groups.get(id).push(row); }
    if (!grouping.length && !groups.size) groups.set('[]', []);
    entries = [...groups.values()].map((group) => ({ binding: group[0] ?? {}, cells: ast.returns.map(({ expr }) => {
      if (expr.kind !== 'count') return value(expr, group[0]);
      const values = group.map((row) => value(expr.arg, row)).filter((entry) => entry != null);
      return expr.distinct ? new Set(values.map(key)).size : values.length;
    }) }));
  } else entries = bindings.map((row) => ({ binding: row, cells: ast.returns.map(({ expr }) => value(expr, row)) }));
  if (ast.distinct) { const seen = new Set(); entries = entries.filter(({ cells }) => { const id = key(cells); if (seen.has(id)) return false; seen.add(id); return true; }); }
  const columns = ast.returns.map((entry) => entry.alias);
  const orderValue = (entry, expr) => expr.kind === 'alias' ? entry.cells[columns.indexOf(expr.name)] : value(expr, entry.binding);
  entries.sort((a, b) => {
    for (const { expr, desc } of ast.orders) {
      const left = orderValue(a, expr), right = orderValue(b, expr);
      const compared = left == null ? right == null ? 0 : 1 : right == null ? -1 : left < right ? -1 : left > right ? 1 : 0;
      if (compared) return desc ? -compared : compared;
    }
    return 0;
  });
  const rows = entries.slice(ast.skip, ast.skip + ast.limit).map((entry) => entry.cells);
  const nodes = new Map(), edges = new Map();
  const graphNodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const collect = (entry) => {
    if (!entry || typeof entry !== 'object') return;
    if (Array.isArray(entry)) { entry.forEach(collect); return; }
    if (entry.label && graphNodes.get(entry.id) === entry) nodes.set(entry.id, entry);
    else if (entry.type && graph.edges.includes(entry)) { edges.set(entry.id, entry); for (const id of [entry.from, entry.to]) if (graphNodes.has(id)) nodes.set(id, graphNodes.get(id)); }
    else if (Array.isArray(entry.nodes) && Array.isArray(entry.edges)) { entry.nodes.forEach(collect); entry.edges.forEach(collect); }
  };
  rows.forEach((row) => row.forEach(collect));
  return { columns, rows, graph: { nodes: [...nodes.values()], edges: [...edges.values()] } };
}

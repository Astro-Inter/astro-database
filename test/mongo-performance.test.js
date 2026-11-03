import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { mongoPerformanceReport as report } from '../site/data/mongo-performance.js';
import { mongoPerformanceView } from '../site/components/mongo/mongo-performance.js';

test('relatório reduzido preserva as métricas das 16 consultas nas evidências comprimidas', async () => {
  const evidence = JSON.parse(gunzipSync(await fs.readFile(new URL('../mongo/analysis/performance/confirmation.json.gz', import.meta.url))));
  assert.equal(report.workloads.length, 16);
  assert.equal(evidence.workloads.length, 16);
  for (const workload of report.workloads) {
    const original = evidence.workloads.find(item => item.id === workload.id);
    assert.deepEqual(workload.command, original.command);
    for (const [phase, values] of Object.entries(workload.phases)) {
      for (const [key, value] of Object.entries(values)) assert.deepEqual(value, original.phases[phase][key], `${workload.id}/${phase}/${key}`);
    }
    assert.ok(!('beforePlan' in workload) && !('afterPlan' in workload));
  }
  const markup = mongoPerformanceView();
  assert.equal((markup.match(/Resumo do plano · antes/g) ?? []).length, 16);
  assert.equal((markup.match(/Resumo do plano · depois/g) ?? []).length, 16);
  for (const workload of report.workloads) assert.ok(markup.includes(workload.title));
});

async function loader(importReport, route = () => 'mongo-performance') {
  const source = await fs.readFile(new URL('../site/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^import .*mongo-performance/m);
  const start = source.indexOf('let mongoPerformanceView =');
  const code = source.slice(start, source.indexOf('\nfunction render()', start));
  let renders = 0;
  const context = vm.createContext({ importReport, currentRoute: route, render: () => { renders++; } });
  vm.runInContext(code.replace("import('./components/mongo/mongo-performance.js')", 'importReport()'), context);
  return { load: () => vm.runInContext('loadMongoPerformance()', context), renders: () => renders };
}

test('relatório é carregado uma vez, mesmo com renderizações concorrentes', async () => {
  let imports = 0; let resolve;
  const loading = new Promise(done => { resolve = done; });
  const view = await loader(() => { imports++; return loading; });
  const first = view.load(); await view.load();
  assert.equal(imports, 1);
  resolve({ mongoPerformanceView: () => 'relatório' }); await first; await view.load();
  assert.equal(imports, 1); assert.equal(view.renders(), 1);
});

test('carregamento concluído após trocar de rota não redesenha outra página', async () => {
  const view = await loader(async () => ({ mongoPerformanceView: () => '' }), () => 'overview');
  await view.load(); assert.equal(view.renders(), 0);
});

test('falha de carregamento encerra a espera sem criar um ciclo de tentativas', async () => {
  let imports = 0;
  const view = await loader(async () => { imports++; throw new Error('offline'); });
  await view.load(); await view.load();
  assert.equal(imports, 1); assert.equal(view.renders(), 1);
});

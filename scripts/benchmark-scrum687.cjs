const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

async function main() {
  const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/analise-performance-SCRUM-687/final-selection.json'), 'utf8'));
  const client = new Client({
    host: process.env.POSTGRES_HOST || process.env.PGHOST,
    port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
    database: process.env.POSTGRES_NAME || process.env.PGDATABASE,
    user: process.env.POSTGRES_USER || process.env.PGUSER,
    password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
    ssl: process.env.PGSSLROOTCERT ? { ca: fs.readFileSync(process.env.PGSSLROOTCERT, 'utf8') } : { rejectUnauthorized: process.env.SCRUM687_ALLOW_PRIVATE_CA !== 'true' },
    connectionTimeoutMillis: 15000,
    application_name: 'SCRUM-687-readonly-replay'
  });
  const report = { measuredAt: new Date().toISOString(), repetitions: 15, warmups: 3, workloads: [] };
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='3s'; SET LOCAL idle_in_transaction_session_timeout='30s'");
    for (const workload of evidence.workloads) {
      const sql = workload.sql
        .replaceAll("'<FIREBASE_UID>'", '(SELECT firebase_uid FROM usuario WHERE id_usuario=17)')
        .replaceAll("'<NOME_USUARIO>'", '(SELECT nome FROM usuario WHERE id_usuario=17)');
      if (!/^\s*(SELECT|WITH)\b/i.test(sql) || /;\s*\S/.test(sql)) throw new Error('A reprodução aceita uma consulta de leitura por cenário.');
      const prefix = 'EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT JSON) ';
      const estimated = (await client.query('EXPLAIN (FORMAT JSON) ' + sql)).rows[0]['QUERY PLAN'][0];
      await client.query(Array(3).fill(prefix + sql).join(';'));
      const batches = await client.query(Array(15).fill(prefix + sql).join(';'));
      const plans = batches.map(result => result.rows[0]['QUERY PLAN'][0]);
      const times = plans.map(plan => plan['Execution Time']).sort((a, b) => a - b);
      // Plans may contain personal filter literals. Print metrics only.
      report.workloads.push({ id: workload.id, estimatedCost: estimated.Plan['Total Cost'], medianMs: times[7], p95Ms: times[14], samplesMs: plans.map(plan => plan['Execution Time']) });
    }
    await client.query('ROLLBACK');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

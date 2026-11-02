/** Valida grants em PostgreSQL 17 descartável. Não recebe DSN nem toca produção.
 * node scripts/validate-postgresql-users.mjs CAMINHO_SNAPSHOTS CAMINHO_PLANO CAMINHO_RESULTADO
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [snapshotArg, planArg, resultArg] = process.argv.slice(2);
if (!snapshotArg || !planArg || !resultArg) throw new Error('Informe snapshots, plano SQL e saída JSON.');
const snapshots = path.resolve(snapshotArg);
const catalog = JSON.parse(await fs.readFile(path.join(root, 'database/users/catalog.json'), 'utf8'));
const results = [];
let queued = [];
let container;
function docker(args, input) {
  const r = spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024, timeout: 60000 });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? String(r.error ?? '') };
}
function sql(text, { user = 'postgres', database = 'astro_audit', expectDenied = false, label = '', record = true } = {}) {
  if (record) {
    queued.push({ text, user, database, expectDenied, label });
    return {};
  }
  const prefix = user === 'postgres' ? '' : `SET SESSION AUTHORIZATION ${user};\n`;
  const r = docker(['exec', '-i', container, 'psql', '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database], '\\set VERBOSITY verbose\n' + prefix + text);
  const passed = expectDenied ? r.status !== 0 && /42501/.test(r.stderr) : r.status === 0;
  if (record) {
    results.push({ label, user, database, expected: expectDenied ? '42501 permission denied' : 'success', passed, ...(passed ? {} : { error: r.stderr.slice(0, 1800) }) });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${label || user}`);
  }
  if (!passed && !record) throw new Error(`${label}: ${r.stderr}`);
  return r;
}
function flushChecks() {
  for (const database of [...new Set(queued.map(q => q.database))]) {
    const checks = queued.filter(q => q.database === database);
    const statements = checks.map((q, i) => {
      const query = q.expectDenied
        ? `DO $denied$ BEGIN BEGIN EXECUTE ${literal(q.text)}; EXCEPTION WHEN insufficient_privilege THEN RETURN; END; RAISE EXCEPTION 'Operation should have been denied'; END; $denied$;`
        : q.text;
      return `SET SESSION AUTHORIZATION ${q.user};\n${query}\nRESET SESSION AUTHORIZATION;\n\\echo AUDIT_PASS_${i}\n`;
    });
    const r = docker(['exec', '-i', container, 'psql', '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database], statements.join('\n'));
    for (const [i, q] of checks.entries()) {
      const passed = r.stdout.split(/\r?\n/).includes(`AUDIT_PASS_${i}`);
      results.push({ label: q.label, user: q.user, database, expected: q.expectDenied ? '42501 permission denied' : 'success', passed, ...(passed ? {} : { error: r.stderr.slice(-1800) }) });
      console.log(`${passed ? 'PASS' : 'FAIL'} ${q.label}`);
    }
    if (r.status) throw new Error(`Validation batch failed: ${r.stderr}`);
  }
  queued = [];
}
async function source(repo, file) { return fs.readFile(path.join(snapshots, repo, file), 'utf8'); }
function literal(v) { return v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`; }
function prepared(user, label, query, values) {
  sql(`PREPARE audit_statement AS ${query};\nEXPLAIN EXECUTE audit_statement(${values.map(literal).join(', ')}); DEALLOCATE audit_statement;`, { user, label });
}
try {
  const r = docker(['run', '-d', '--rm', '--network', 'none', '--label', 'astro.audit=postgresql-users', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-e', 'POSTGRES_DB=astro_audit', 'postgres:17']);
  if (r.status) throw new Error(r.stderr);
  container = r.stdout.trim();
  if (!/^[0-9a-f]{64}$/.test(container)) throw new Error('ID Docker inválido.');
  for (let i = 0; i < 30; i++) {
    const ready = docker(['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']);
    if (!ready.status) break;
    if (i === 29) throw new Error('PostgreSQL não iniciou.');
    await setTimeout(500);
  }
  const plan = JSON.parse(await fs.readFile(path.resolve(planArg), 'utf8'));
  const schemaParts = [];
  for (const item of plan) {
    if (!item.path.startsWith('database/') || item.path.includes('..')) throw new Error('Caminho do plano inválido.');
    schemaParts.push(`-- ${item.path}\n${await fs.readFile(path.join(root, item.path), 'utf8')}`);
  }
  console.log('Installing disposable schema in one batch');
  sql(schemaParts.join('\n'), { record: false, label: 'workspace schema' });
  sql(await source('astro-medallion-api', 'migrations/001_history_and_snapshots.sql'), { record: false, label: 'medallion migration' });
  sql(`REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public, astro_api FROM PUBLIC;
REVOKE EXECUTE ON ALL PROCEDURES IN SCHEMA public, astro_api FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE DATABASE legacy_audit;`, { record: false });
  sql(`CREATE TABLE empresa (id_empresa bigint, nome text, cnpj text);
CREATE TABLE departamento (id_departamento bigint, nome text, id_empresa bigint);
CREATE TABLE funcionario (id_funcionario bigint, cpf text, nome text, cargo text, id_empresa bigint, id_departamento bigint, email text);
CREATE TABLE email (id_funcionario bigint, id_email bigint, email text);`, { database: 'legacy_audit', record: false });
  for (const u of catalog.users) {
    sql(await fs.readFile(path.join(root, u.file), 'utf8'), { database: u.database === 'Legado' ? 'legacy_audit' : 'astro_audit', label: `install ${u.name}` });
  }
  flushChecks();
  const version = sql('SHOW server_version;', { record: false }).stdout.trim();
  const uid = sql("SELECT firebase_uid FROM usuario WHERE tipo='GESTOR_WORKSPACE' ORDER BY id_usuario LIMIT 1;", { record: false }).stdout.trim();
  const collaborator = sql("SELECT firebase_uid FROM usuario WHERE tipo='COLABORADOR' ORDER BY id_usuario LIMIT 1;", { record: false }).stdout.trim();
  const userId = sql('SELECT min(id_usuario) FROM usuario;', { record: false }).stdout.trim();
  // Native PostgreSQL checks on every active grant (including views and column ACLs).
  for (const u of catalog.users) {
    if (u.database === 'Legado') continue;
    for (const g of u.grants) {
      const select = g.privileges.match(/SELECT(?:\s*\(([^)]+)\))?/);
      if (select) sql(`SELECT ${select[1] || '*'} FROM ${g.object} LIMIT 0;`, { user: u.name, label: `${u.name} read ${g.object}` });
    }
  }
  // Queries are imported from the downloaded source, not rewritten copies.
  const { candidateQuery } = await import(pathToFileURL(path.join(snapshots, 'astro-notification-service/src/rules/queries.ts')));
  const ctx = { now: new Date('2026-11-02T12:00:00Z'), today: '2026-11-02', settings: { expiryWarningDays: [7, 15, 30], batchSize: 100, classWarningHours: 24, validationWaitHours: 24 } };
  for (const [rule, user] of [['expiring-compliance', 'svc_notif_expiring'], ['expired-compliance', 'svc_notif_expired'], ['class-deadlines', 'svc_notif_deadlines'], ['pending-validations', 'svc_notif_pending']]) {
    const q = candidateQuery(rule, ctx, '0'); prepared(user, `actual query ${rule}`, q.text, q.values);
  }
  const { pendingRecipientsQuery } = await import(pathToFileURL(path.join(snapshots, 'astro-notification-service/src/push/query.ts')));
  for (const id of [undefined, userId]) {
    const q = pendingRecipientsQuery('0', 100, id); prepared('svc_notif_event_push', `actual pending push ${id === undefined ? 'page' : 'current'}`, q.text, q.values);
  }
  const membership = (await source('astro-dashboard-api', 'src/auth/workspace.ts')).match(/membershipSql = `([\s\S]*?)`;/)[1];
  prepared('svc_dashboard', 'actual dashboard authorization', membership, [uid]);
  // Execute to resolve SECURITY INVOKER dependencies, not just explain.
  sql(`SELECT id_admin FROM admin WHERE email='audit@example.invalid' LIMIT 1;`, { user: 'svc_astro_api', label: 'API existsByEmail admin (projection id)' });
  for (const [user, id] of [['svc_astro_api', uid], ['svc_astro_ai', uid], ['svc_dashboard', uid]]) {
    sql(`SELECT fn_retornar_nivel_acesso(${literal(id)});`, { user, label: `${user} authorization invoker` });
  }
  for (const user of ['svc_astro_api', 'svc_astro_ai']) sql(`SELECT * FROM fn_seleciona_unidades(${literal(uid)});`, { user, label: `${user} unit function invoker` });
  const reads = ['fn_carrega_home_colaborador', 'fn_carrega_home_gestor', 'fn_carrega_workspace', 'fn_seleciona_cargos', 'fn_carrega_colaboradores'];
  for (const f of reads) sql(`SELECT * FROM ${f}(${literal(f.includes('home_colaborador') ? collaborator : uid)});`, { user: 'svc_astro_api', label: `API ${f}` });
  sql(`SELECT fn_retornar_tipo_conta('ana.almeida.001@example.com'); SELECT * FROM fn_seleciona_cargo_nrs(${literal(uid)},1); SELECT * FROM fn_seleciona_unidade_nrs(${literal(uid)},1); SELECT * FROM fn_seleciona_candidatos_evento(${literal(uid)},10); SELECT * FROM fn_carrega_evento_colaborador(${literal(uid)},${userId});`, { user: 'svc_astro_api', label: 'API remaining read routines' });
  sql(`SELECT fn_registrar_acesso_diario(${literal(uid)}::varchar);`, { user: 'svc_astro_api', label: 'API daily access insert' });
  sql(`BEGIN; CALL pr_inseri_cargo(${literal(uid)},'Cargo de auditoria','Ativo');
SELECT fn_altera_status_cargo(${literal(uid)},1);
SELECT * FROM fn_altera_cargo(${literal(uid)},1,'Cargo auditado','Ativo');
SELECT fn_altera_status_unidade(${literal(uid)},1);
CALL pr_alterar_cargo_nrs(${literal(uid)},1,'[]'::jsonb);
CALL pr_alterar_unidade_nrs(${literal(uid)},1,'[]'::jsonb); ROLLBACK;`, { user: 'svc_astro_api', label: 'API write routines and triggers' });
  sql(`BEGIN; SELECT * FROM nr_catalogo FOR SHARE; LOCK TABLE conformidade IN SHARE ROW EXCLUSIVE MODE; ROLLBACK;`, { user: 'svc_astro_api', label: 'API NR and conformity locks' });
  sql(`BEGIN;
INSERT INTO evento(gestor_id,titulo,descricao,modo_conclusao) SELECT id_usuario,'Evento auditoria de grants','Auditoria descartavel','COLABORADOR' FROM usuario WHERE firebase_uid=${literal(uid)};
INSERT INTO turma(evento_id,nome,data_inicial,data_termino) SELECT id_evento,'Turma auditada',now(),now()+interval '1 day' FROM evento WHERE titulo='Evento auditoria de grants';
INSERT INTO turma_colaborador(turma_id,usuario_id) SELECT t.id_turma,u.id_usuario FROM turma t JOIN evento e ON e.id_evento=t.evento_id CROSS JOIN usuario u WHERE e.titulo='Evento auditoria de grants' AND u.firebase_uid=${literal(collaborator)};
INSERT INTO conclusao_evento(turma_colaborador_id,status) SELECT tc.id_turma_colaborador,'PENDENTE' FROM turma_colaborador tc JOIN turma t ON t.id_turma=tc.turma_id JOIN evento e ON e.id_evento=t.evento_id WHERE e.titulo='Evento auditoria de grants';
ROLLBACK;`, { user: 'svc_astro_api', label: 'API completion insert with main trigger FOR SHARE participant lock' });
  const nrPayload = JSON.stringify([JSON.stringify({ id: 9999, nome: 'NR de auditoria descartável', revogada: false, tempo_reciclagem_mes: 12 })]);
  sql(`BEGIN; CALL ler_json_nr(${literal(nrPayload)}::text); CALL ler_json_nr(${literal(nrPayload)}::text); ROLLBACK;`, { user: 'svc_nr_updater', label: 'NR procedure insert and conflict update + audit trigger' });
  const tracking = (await source('astro-tracking-api', 'src/app/repository.py')).match(/INSERT_EVENTO = """([\s\S]*?)"""/)[1];
  const trackingValues = ['audit-uid', 'click', 'save', 'home', 'audit', null, null, null, null, '127.0.0.1'];
  sql(`BEGIN; PREPARE tracking AS ${tracking}; EXECUTE tracking(${trackingValues.map(literal).join(',')}); ROLLBACK;`, { user: 'svc_tracking', label: 'actual tracking INSERT RETURNING + sequence' });
  const emailQuery = JSON.parse((await source('astro-email-worker', 'cloudflare-free/assets.js')).match(/userQuery=("(?:\\.|[^"\\])*");/)[1]);
  prepared('svc_email_employee', 'actual email employee query', emailQuery, ['ana.almeida.001@example.com']);
  sql('SELECT firebase_uid FROM conta WHERE firebase_uid IS NOT NULL; SELECT EXISTS (SELECT 1 FROM conta WHERE firebase_uid=\'audit\');', { user: 'svc_cleanup', label: 'cleanup inherited UID queries' });
  // Real RPA shape: upsert, ON CONFLICT, RETURNING, row lock and inherited account guards.
  sql(`BEGIN;
SELECT 1 FROM admin WHERE lower(trim(email))='audit@example.invalid' OR firebase_uid='audit';
SELECT 1 FROM ONLY conta WHERE lower(trim(email))='audit@example.invalid' OR firebase_uid='audit';
SELECT id_usuario,cpf,email,firebase_uid,cargo_id,unidade_id FROM usuario WHERE cpf='90000000001' OR lower(trim(email))='audit@example.invalid' FOR UPDATE;
INSERT INTO workspace(nome,cnpj) VALUES ('Audit','99999999000199') ON CONFLICT(cnpj) DO UPDATE SET nome=EXCLUDED.nome RETURNING id_workspace;
INSERT INTO cargo(workspace_id,nome,ativo) VALUES (1,'Audit',true) ON CONFLICT(workspace_id,nome) DO NOTHING;
INSERT INTO unidade(workspace_id,nome,ativo) VALUES (1,'Audit',true) ON CONFLICT(workspace_id,nome) DO NOTHING;
INSERT INTO usuario(nome,email,cpf,firebase_uid,cargo_id,unidade_id,tipo,status) VALUES ('Audit','audit@example.invalid','99999999999','audit-only',1,1,'COLABORADOR','ATIVO') RETURNING id_usuario;
UPDATE usuario SET nome='Audit' WHERE firebase_uid='audit-only'; ROLLBACK;`, { user: 'svc_rpa_target', label: 'RPA target DML/locks/guards + audit/SCD' });
  sql(`SELECT f.id_funcionario,f.cpf,f.nome,f.cargo,f.id_empresa,e.nome,e.cnpj,f.id_departamento,d.nome,d.id_empresa FROM funcionario f LEFT JOIN empresa e ON e.id_empresa=f.id_empresa LEFT JOIN departamento d ON d.id_departamento=f.id_departamento; SELECT attname,atttypid='bytea'::regtype FROM pg_attribute WHERE attrelid='funcionario'::regclass;`, { user: 'svc_rpa_legacy', database: 'legacy_audit', label: 'RPA legacy base and catalog' });
  // Medallion grants cover read sources, fact sequence, snapshots and rate limiting.
  sql(`BEGIN; SELECT nextval('astro_api.fact_id_seq'); INSERT INTO astro_api.rate_buckets(client_key,bucket,requests) VALUES ('audit',NOW(),1) ON CONFLICT(client_key,bucket) DO UPDATE SET requests=astro_api.rate_buckets.requests+1 RETURNING requests; DELETE FROM astro_api.rate_buckets WHERE client_key='audit'; ROLLBACK;`, { user: 'svc_medallion', label: 'Medallion internal DML and sequence' });
  sql(`BEGIN; INSERT INTO astro_api.snapshots(snapshot_id,layer,dataset,scope,payload,captured_at,expires_at,retained)
VALUES ('00000000-0000-0000-0000-000000000001','bronze','audit','{}','[]',now(),now()+interval '1 day',false) RETURNING snapshot_id;
SELECT payload FROM astro_api.snapshots WHERE dataset='audit'; DELETE FROM astro_api.snapshots WHERE dataset='audit'; ROLLBACK;`, { user: 'svc_medallion', label: 'Medallion snapshot insert/read/delete' });
  // Negative checks: same grant profile cannot write beyond its purpose.
  for (const u of catalog.users.filter(u => ['svc_astro_ai','svc_dashboard','svc_email_employee','svc_cleanup','ops_backup'].includes(u.name) || u.name.startsWith('svc_notif_'))) {
    sql('DELETE FROM usuario WHERE false;', { user: u.name, expectDenied: true, label: `${u.name} cannot delete users` });
  }
  for (const user of ['svc_tracking', 'svc_nr_updater', 'svc_medallion', 'svc_rpa_target']) sql('DELETE FROM workspace WHERE false;', { user, expectDenied: true, label: `${user} cannot delete workspace` });
  sql('UPDATE evento_astro SET nome_tela=\'x\' WHERE false;', { user: 'svc_tracking', expectDenied: true, label: 'tracking cannot update events' });
  sql('SELECT cpf FROM usuario LIMIT 0;', { user: 'svc_medallion', expectDenied: true, label: 'Medallion cannot read CPF' });
  sql('SELECT email FROM usuario LIMIT 0;', { user: 'svc_notif_event_push', expectDenied: true, label: 'push cannot read email' });
  sql("SELECT fn_registrar_acesso_diario('audit'::varchar);", { user: 'svc_astro_ai', expectDenied: true, label: 'AI cannot execute write function' });
  flushChecks();
  const backup = docker(['exec', container, 'pg_dump', '-U', 'ops_backup', '-d', 'astro_audit', '--format=custom', '--file=/tmp/audit.dump']);
  results.push({ label: 'pg_dump complete database', user: 'ops_backup', expected: 'success', passed: backup.status === 0, ...(backup.status ? { error: backup.stderr.slice(0,1800) } : {}) });
  await fs.writeFile(path.resolve(resultArg), JSON.stringify({ version, disposable: true, portsPublished: false, snapshots: JSON.parse(await fs.readFile(path.join(snapshots,'inventory.json'),'utf8')), results, passed: results.filter(r=>r.passed).length, failed: results.filter(r=>!r.passed).length },null,2)+'\n');
  console.log(JSON.stringify({ checks: results.length, failed: results.filter(r=>!r.passed).length }));
  if (results.some(r=>!r.passed)) process.exitCode=1;
} finally {
  if (container) {
    const stopped = docker(['stop', container]);
    if (stopped.status) console.error('Falha ao encerrar container descartável:', container);
  }
}

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { analyzeUsers } from '../analyzer/users/index.js';
import { analyzeWorkspace } from '../analyzer/index.js';
import { usersView } from '../site/views-users.js';

test('perfis PostgreSQL apontam para objetos/colunas existentes sem entrar nas migrações', async () => {
  const [catalog, database] = await Promise.all([analyzeUsers({ write: false }), analyzeWorkspace({ write: false })]);
  assert.equal(catalog.users.length, 16);
  assert.equal(new Set(catalog.users.map(u => u.service)).size, 11);
  assert.ok(catalog.users.every(u => u.service !== 'astro-database'));
  assert.equal(database.files.some(f => f.path.startsWith('database/users/')), false);
  const objects = new Map(database.objects.map(o => [o.name.replace(/^public\./, ''), o]));
  for (const user of catalog.users) {
    assert.match(user.sql, new RegExp(`CREATE ROLE ${user.name} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`));
    assert.doesNotMatch(user.sql, /PASSWORD\s+'|GRANT\s+ALL\b|pg_read_all_data/i);
    if (user.database === 'Legado') continue;
    for (const grant of user.grants) {
      if (!grant.object.startsWith('public.')) continue;
      const name = grant.object.slice(7);
      const object = objects.get(name);
      assert.ok(object, `${user.name}: objeto ausente ${name}`);
      // Grants por coluna devem corresponder ao catálogo, inclusive herança.
      for (const match of (object.type === 'table' ? grant.privileges.matchAll(/\(([^)]+)\)/g) : [])) {
        for (const column of match[1].split(',').map(c => c.trim())) {
          assert.ok(object.columns?.some(c => c.name === column), `${user.name}: coluna ausente ${name}.${column}`);
        }
      }
      assert.ok(user.sql.includes(`GRANT ${grant.privileges} ON TABLE ${grant.object} TO ${user.name};`));
    }
  }
});

test('leitores não recebem escrita; blocos condicionais do legado/RPA ficam opcionais', async () => {
  const { users } = await analyzeUsers({ write: false });
  const readers = users.filter(u => /svc_notif_|svc_cleanup|svc_dashboard|svc_astro_ai|svc_email_employee/.test(u.name));
  for (const user of readers) {
    assert.doesNotMatch(user.sql, /GRANT\s+(?:INSERT|UPDATE|DELETE|TRUNCATE)|GRANT\s+[^;]*,\s*(?:INSERT|UPDATE|DELETE)/i);
  }
  const rpa = users.find(u => u.name === 'svc_rpa_target');
  const active = rpa.sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  assert.doesNotMatch(active, /rpa_sync_control|rpa_sync_users|rpa_user_links/);
  const legacy = users.find(u => u.name === 'svc_rpa_legacy');
  assert.equal(legacy.conditional.length, 3);
  assert.equal(users.filter(u => u.hosting === 'AWS').length, 2);
  assert.equal(users.filter(u => u.hosting === 'GitHub Actions').length, 1);
  assert.equal(users.filter(u => u.hosting === 'Cloudflare').length, 13);
});

test('página apresenta SQL escapado, hospedagem, navegação e recuperação de erro', async () => {
  const data = await analyzeUsers({ write: false });
  data.users[0].notes.push('<script>unsafe()</script>');
  const html = usersView({ data });
  assert.ok(html.includes('&lt;script&gt;unsafe()&lt;/script&gt;'));
  assert.ok(html.includes('data-user-focus="svc_astro_api"'));
  assert.ok(html.includes('data-copy-user="svc_tracking"'));
  assert.ok(html.includes('SQL de criação e GRANTs'));
  assert.ok(html.includes('GitHub Actions') && html.includes('AWS') && html.includes('Cloudflare'));
  assert.doesNotMatch(html, /href="#user-/);
  assert.match(usersView({ error: 'Falha' }), /data-retry-users/);
  const app = await fs.readFile(new URL('../site/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes("route === 'users'"));
});

test('regressão da auditoria: checagem de admin, conflito de acesso e sequence real do tracking', async () => {
  const { users } = await analyzeUsers({ write: false });
  const api = users.find(u => u.name === 'svc_astro_api');
  assert.ok(api.sql.includes('SELECT (id_admin, email, firebase_uid) ON TABLE public.admin'));
  assert.ok(api.sql.includes('SELECT (data, firebase_uid), INSERT (data, firebase_uid) ON TABLE public.acesso'));
  assert.ok(api.sql.includes('UPDATE (id_turma_colaborador) ON TABLE public.turma_colaborador'));
  const tracking = users.find(u => u.name === 'svc_tracking');
  assert.ok(tracking.sql.includes("pg_get_serial_sequence(relation_name, 'id_evento')"));
  assert.doesNotMatch(tracking.sql, /'id_' \|\| split_part/);
  const rpa = users.find(u => u.name === 'svc_rpa_target');
  assert.ok(rpa.sql.includes('UPDATE (nome, email, cpf, firebase_uid, cargo_id, unidade_id) ON TABLE public.usuario'));
  const ia = users.find(u => u.name === 'svc_astro_ai');
  assert.ok(ia.sql.includes('SELECT (conclusao_evento_id) ON TABLE public.evidencia'));
});

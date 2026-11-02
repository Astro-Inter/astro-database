import { escapeHtml as esc } from './utils.js';
import { pageHead } from './views.js';

export function usersView({ data, error }) {
  const head = pageHead('Usuários e acessos', 'Identidades PostgreSQL por serviço, finalidade e permissões necessárias.', 'PostgreSQL');
  if (!data) return `${head}<section class="card" role="status">${error ? `<p>${esc(error)}</p><button class="button" data-retry-users>Tentar novamente</button>` : '<p>Carregando usuários e permissões…</p>'}</section>`;
  return `<div class="users-report">${head}
    <section class="card"><div class="card-head"><h2>Acessos por serviço</h2><span class="badge">Proposta · não aplicada</span></div>
      <p>16 usuários para 11 serviços: 15 identidades de aplicações/jobs e 1 de backup. O RPA tem origem e destino separados; notificações têm cinco leitores. <code>astro-database</code> está fora do provisionamento.</p>
      <p>Backup no GitHub Actions; APIs Java e IA na AWS; demais serviços na Cloudflare. Cada usuário tem credencial própria por ambiente.</p>
      <p class="muted">Base da revisão: 02/11/2026. Os scripts abaixo criam logins e concedem acesso no banco conectado. Não foram aplicados nos ambientes dos serviços. A senha será definida na criação real e não integra o catálogo.</p>
      ${data.verification ? `<p>Revisão dos ${esc(data.verification.repositories)} repositórios: ${esc(data.verification.checks)} verificações aprovadas em PostgreSQL ${esc(data.verification.postgresql)}, em banco descartável. Inclui consultas, rotinas, triggers, sequences, recusas de acesso e pg_dump. ${esc(data.verification.limitations)}</p>` : ''}
      <div class="table-wrap"><table><thead><tr><th>Usuário</th><th>Serviço / processo</th><th>Hospedagem</th><th>Banco</th><th>Perfil</th></tr></thead><tbody>${data.users.map(u => `<tr><td><button class="button ghost" data-user-focus="${esc(u.name)}"><code>${esc(u.name)}</code></button></td><td>${esc(u.service)}<br><small>${esc(u.process)}</small></td><td>${esc(u.hosting)}</td><td>${esc(u.database)}</td><td>${esc(u.profile)}</td></tr>`).join('')}</tbody></table></div>
    </section>
    <section class="card"><h2>Antes de aplicar</h2><p>Conectar ao banco indicado, conferir objetos instalados e privilégios de PUBLIC/memberships. GRANT adiciona acesso; não elimina permissões amplas já existentes. Usuários por serviço não isolam linhas por workspace.</p>
      <p>Nos Workers, a credencial da origem pertence ao Hyperdrive. Conectores compartilhados precisam ser separados para manter identidades próprias. Na AWS, atualizar os secrets das APIs; no GitHub Actions, os secrets do backup. Validar cada serviço após a troca.</p>
      <p>Na criação real, gerar senhas individuais e entregar o TXT <code>usuário: senha</code> fora do repositório, sem publicar no site, Git ou logs. Este catálogo não contém senhas.</p>
    </section>
    ${data.users.map(userCard).join('')}
  </div>`;
}

function userCard(u) {
  const grantRows = u.grants.map(g => `<tr><td><code>${esc(g.object)}</code></td><td>${esc(g.privileges)}</td></tr>`).join('');
  return `<section class="card user-access-card" id="user-${esc(u.name)}">
    <div class="card-head"><h2><code>${esc(u.name)}</code></h2><button class="button ghost" data-copy-user="${esc(u.name)}">Copiar SQL</button></div>
    <p><strong>${esc(u.service)}</strong> · ${esc(u.process)}</p>
    <p>${esc(u.purpose)}</p><p class="muted">${esc(u.hosting)} · Banco ${esc(u.database)} · ${esc(u.connection)}</p>
    ${u.notes.length ? `<ul>${u.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${grantRows ? `<div class="table-wrap"><table><thead><tr><th>Objeto</th><th>Privilégios</th></tr></thead><tbody>${grantRows}</tbody></table></div>` : '<p>Backup integral: leitura de todas as tabelas e sequences dos schemas cobertos, sem escrita.</p>'}
    <details><summary>SQL de criação e GRANTs</summary><p>Executar uma vez, como administrador, no banco ${esc(u.database)} correto. Definir a senha por canal seguro antes de trocar a conexão do serviço.</p><pre class="code code-shell"><code>${esc(u.sql)}</code></pre></details>
    ${u.conditional.map(c => `<details><summary>Acesso condicional · ${esc(c.title)}</summary><p>${esc(c.reason)}</p><pre class="code code-shell"><code>${esc(c.sql)}</code></pre></details>`).join('')}
    <p class="muted"><code>${esc(u.file)}</code></p>
  </section>`;
}

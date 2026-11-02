# Serviços Astro que precisam de usuário PostgreSQL

Revisão de **02/11/2026**. Foram enumerados pela API do GitHub **21 repositórios acessíveis** da organização Astro-Inter, todos públicos e não arquivados. Foram baixados snapshots das branches padrão `main`, com SHA fixado em [repositorios-analisados.json](repositorios-analisados.json).

**Lista final de provisionamento: 11 repositórios, sendo 10 de aplicações/jobs e 1 de backup.** O `astro-database` foi excluído da lista a pedido do usuário; permanece apenas no histórico da análise dos 21 repositórios. Os outros 9 não apresentam consumidor PostgreSQL próprio no código analisado. Contando os processos de notificações separadamente e as duas conexões do RPA, a proposta tem **15 identidades de runtime + 1 de backup = 16 identidades por ambiente**. Restore pode usar uma 17ª identidade operacional, conforme a política de recuperação. Esses nomes são propostas; não se verificou que os logins existam.

A análise cobre o código e as configurações versionadas dessas branches, incluindo variantes locais, Workers, scripts, workflows e migrações. Não confirma serviços realmente implantados, credenciais de secrets/Hyperdrive, ACLs, owners, RLS, outras branches, serviços externos à organização ou repositórios inacessíveis. Nenhuma conexão com o banco ou alteração de usuário/permissão foi realizada. Um serviço via Hyperdrive também depende de usuário PostgreSQL na origem.

## Inventário dos consumidores

S = SELECT; I = INSERT; U = UPDATE; D = DELETE. As permissões aqui são um levantamento para provisionamento, **não um script de GRANT validado**. Objetos sem schema explícito dependem do search_path real.

| Repositório / processo | Usuário sugerido | Acesso necessário | Evidência |
| --- | --- | --- | --- |
| `astro-api` / API Java | `svc_astro_api` | SELECT/INSERT/UPDATE/DELETE por objeto; EXECUTE | [src/main/java/com/astro/api/auth/repository/AuthRepository.java](https://github.com/Astro-Inter/astro-api/blob/2066ef87c29148eb9be15ce50e5553a8ff99e6c0/src/main/java/com/astro/api/auth/repository/AuthRepository.java#L1) |
| `astro-ai-api` / API IA, ferramentas e autorização | `svc_astro_ai` | SELECT; EXECUTE | [app/infrastructure/database/connections.py](https://github.com/Astro-Inter/astro-ai-api/blob/e811ea8c2a7bfa5ccf5d84c67d9f9de6c0c63bdf/app/infrastructure/database/connections.py#L1) |
| `data-integration-rpa` / Origem legado | `svc_rpa_legacy` | SELECT; EXECUTE condicional | [cloudflare/repositories.ts](https://github.com/Astro-Inter/data-integration-rpa/blob/f420eef6035d293bd21d545f8ba5e9bf7bd9f3e5/cloudflare/repositories.ts#L1) |
| `data-integration-rpa` / Destino Astro | `svc_rpa_target` | SELECT/INSERT/UPDATE por objeto | [cloudflare/target-user-repository.ts](https://github.com/Astro-Inter/data-integration-rpa/blob/f420eef6035d293bd21d545f8ba5e9bf7bd9f3e5/cloudflare/target-user-repository.ts#L1) |
| `astro-email-worker` / Colaboradores; Worker Cloudflare combinado | `svc_email_employee` | SELECT | [src/repositories/userRepository.js](https://github.com/Astro-Inter/astro-email-worker/blob/c74ef8282bd3f556f8cc02b30139c3edd8e6d469/src/repositories/userRepository.js#L1) |
| `nr-updater` / Atualização catálogo NRs | `svc_nr_updater` | EXECUTE; SELECT/INSERT/UPDATE internos | [cloudflare/worker.ts](https://github.com/Astro-Inter/nr-updater/blob/73a99b658d4c0c3724f5ddb412c042758e0e1b75/cloudflare/worker.ts#L1) |
| `astro-data-cleanup` / Reconciliação Firebase | `svc_cleanup` | SELECT(firebase_uid) | [cloudflare/connectors.ts](https://github.com/Astro-Inter/astro-data-cleanup/blob/102561bb00e1e7a2b6c5b6d8d7815c801f83ce44/cloudflare/connectors.ts#L1) |
| `astro-tracking-api` / Coleta de eventos de navegação | `svc_tracking` | INSERT; SELECT do RETURNING e health check; USAGE sequence | [src/app/repository.py](https://github.com/Astro-Inter/astro-tracking-api/blob/5f35be589fabe839cb3875bd54879e9bc4b7a1cf/src/app/repository.py#L1) |
| `astro-medallion-api` / API e captura Bronze/Silver/Gold | `svc_medallion` | SELECT fontes; DML interno; USAGE sequence | [app/bronze/datasets.py](https://github.com/Astro-Inter/astro-medallion-api/blob/c9a40d57105ef35a286449b26b248d456531b29e/app/bronze/datasets.py#L1) |
| `astro-notification-service` / expiring-compliance | `svc_notif_expiring` | SELECT | [src/rules/queries.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/rules/queries.ts#L1) |
| `astro-notification-service` / expired-compliance | `svc_notif_expired` | SELECT | [src/rules/queries.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/rules/queries.ts#L1) |
| `astro-notification-service` / class-deadlines | `svc_notif_deadlines` | SELECT | [src/rules/queries.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/rules/queries.ts#L1) |
| `astro-notification-service` / pending-validations | `svc_notif_pending` | SELECT | [src/rules/queries.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/rules/queries.ts#L1) |
| `astro-notification-service` / pending-events-push | `svc_notif_event_push` | SELECT | [src/push/query.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/push/query.ts#L1) |
| `astro-dashboard-api` / Autorização de workspace | `svc_dashboard` | SELECT; EXECUTE | [src/auth/workspace.ts](https://github.com/Astro-Inter/astro-dashboard-api/blob/8d792fc991ff132314a6c9f6d40b6138ad352ec1/src/auth/workspace.ts#L1) |
| `postgresql-backup` / Backup integral | `ops_backup` | Leitura integral para pg_dump | [.github/workflows/backup.yml](https://github.com/Astro-Inter/postgresql-backup/blob/787a8c150259a6b2fd81e9ecb871748b9afae35b/.github/workflows/backup.yml#L1) |

A [matriz-servicos.csv](matriz-servicos.csv) detalha objetos, configuração da conexão e ressalvas por processo. Não existe exigência técnica de um login por repositório; a separação proposta permite restringir privilégios e identificar o consumidor. Uma identidade fica no banco legado; as outras 15, no ambiente Astro. Ambientes diferentes devem usar credenciais próprias.

## API principal: leitura e escrita de negócio

Perfil proposto para as operações encontradas, incluindo rotinas invoker e persistência JPA:

| Objeto | Operações |
| --- | --- |
| workspace | S, I |
| cargo, unidade | S, I, U |
| unidade_endereco | S, I, U; edição de endereço está implementada |
| usuario | S, I, U |
| usuario_foto_perfil | S, I, U |
| admin | S(id_admin, email, firebase_uid): checagem de e-mail e autorização |
| nr_catalogo | S; lock pessimista exige verificar privilégio de U |
| cargo_nr, unidade_nr | S, I, D |
| evento | S, I, U |
| turma, turma_colaborador | S, I, D; turma também U |
| conclusao_evento | S, I, U |
| evidencia | S, I, D |
| conformidade | S, I, U |
| acesso | S/I(data, firebase_uid) pela função fn_registrar_acesso_diario(varchar), incluindo ON CONFLICT |

Views identificadas diretamente ou pelas rotinas: `vw_gestores`, `vw_colaboradores`, `vw_conformidade_colaborador`, `vw_conformidade_unidade`, `vw_eventos_gestor`, `vw_cargos`, `vw_unidades`, `vw_home_estatisticas_gerais`. Conferir dependências das views e seu modo de segurança antes de traduzir isso em ACLs.

EXECUTE das rotinas: `fn_retornar_nivel_acesso(text)`, `fn_retornar_tipo_conta(text)`, `fn_registrar_acesso_diario(varchar)`, `fn_carrega_home_colaborador(text)`, `fn_carrega_home_gestor(text)`, `fn_carrega_workspace(text)`, `fn_seleciona_cargos(text)`, `fn_seleciona_cargo_nrs(text,bigint)`, `fn_altera_status_cargo(text,bigint)`, `fn_altera_cargo(text,bigint,text,text)`, `pr_inseri_cargo(text,text,text)`, `pr_alterar_cargo_nrs(text,bigint,jsonb)`, `fn_seleciona_unidades(text)`, `fn_seleciona_unidade_nrs(text,bigint)`, `fn_altera_status_unidade(text,bigint)`, `pr_alterar_unidade_nrs(text,bigint,jsonb)`, `fn_seleciona_candidatos_evento(text,integer)`, `fn_carrega_colaboradores(text)` e `fn_carrega_evento_colaborador(text,bigint)`. As assinaturas devem ser confrontadas com o catálogo instalado.

Conceder USAGE somente nas sequences realmente usadas nos INSERTs. Acesso diário não usa sequence no DDL atual. Não inferir CRUD completo apenas porque uma entidade estende JpaRepository.

Fontes: [src/main/java/com/astro/api/unit/service/UnitSettingsService.java](https://github.com/Astro-Inter/astro-api/blob/2066ef87c29148eb9be15ce50e5553a8ff99e6c0/src/main/java/com/astro/api/unit/service/UnitSettingsService.java#L1), [src/main/java/com/astro/api/auth/security/FirebaseAuthenticationFilter.java](https://github.com/Astro-Inter/astro-api/blob/2066ef87c29148eb9be15ce50e5553a8ff99e6c0/src/main/java/com/astro/api/auth/security/FirebaseAuthenticationFilter.java#L1), [src/main/java/com/astro/api/user/repository/CollaboratorRepository.java](https://github.com/Astro-Inter/astro-api/blob/2066ef87c29148eb9be15ce50e5553a8ff99e6c0/src/main/java/com/astro/api/user/repository/CollaboratorRepository.java#L1), [src/main/java/com/astro/api/event/repository/EventRepository.java](https://github.com/Astro-Inter/astro-api/blob/2066ef87c29148eb9be15ce50e5553a8ff99e6c0/src/main/java/com/astro/api/event/repository/EventRepository.java#L1), [src/main/java/com/astro/api/conformity/repository/UnitConformityRepository.java](https://github.com/Astro-Inter/astro-api/blob/2066ef87c29148eb9be15ce50e5553a8ff99e6c0/src/main/java/com/astro/api/conformity/repository/UnitConformityRepository.java#L1).

## IA e dashboard: leitores com execução de funções

IA usa leitura nas tabelas listadas no CSV; também lê `evidencia` para contar arquivos e `usuario_foto_perfil` para avatares. As ferramentas operacionais usam `vw_conformidade_colaborador` e `fn_seleciona_unidades(text)`, que depende de `vw_unidades`. A conexão compartilhada configura `default_transaction_read_only=on`. A autorização usa `fn_retornar_nivel_acesso(text)`. Não foi localizada escrita PostgreSQL nessas ferramentas; escritas em MongoDB e serviços externos não acrescentam DML SQL.

Dashboard consulta `public.usuario`, `public.unidade` e `public.workspace`, executando `public.fn_retornar_nivel_acesso(text)` para validar o vínculo. Essa função é invoker no DDL versionado e lê `admin.firebase_uid`, `usuario.firebase_uid` e `usuario.tipo`. Apenas EXECUTE não cobre suas dependências. As consultas dos indicadores e do explorer são enviadas ao Databricks por HTTP; precisam da identidade Databricks correspondente, sem ampliar o usuário PostgreSQL.

Fontes: [app/modules/operational/insights.py](https://github.com/Astro-Inter/astro-ai-api/blob/e811ea8c2a7bfa5ccf5d84c67d9f9de6c0c63bdf/app/modules/operational/insights.py#L220), [app/infrastructure/avatar_urls.py](https://github.com/Astro-Inter/astro-ai-api/blob/e811ea8c2a7bfa5ccf5d84c67d9f9de6c0c63bdf/app/infrastructure/avatar_urls.py#L1), [app/modules/operational/tools.py](https://github.com/Astro-Inter/astro-ai-api/blob/e811ea8c2a7bfa5ccf5d84c67d9f9de6c0c63bdf/app/modules/operational/tools.py#L100), [src/auth/workspace.ts](https://github.com/Astro-Inter/astro-dashboard-api/blob/8d792fc991ff132314a6c9f6d40b6138ad352ec1/src/auth/workspace.ts#L22), [src/databricks.ts](https://github.com/Astro-Inter/astro-dashboard-api/blob/8d792fc991ff132314a6c9f6d40b6138ad352ec1/src/databricks.ts#L1), [database/functions/03_fn_retornar_nivel_acesso.sql](https://github.com/Astro-Inter/astro-database/blob/148d8950be459268beee22b11ab1a4c400a45a71/database/functions/03_fn_retornar_nivel_acesso.sql#L1).

## Jobs, e-mail e integração

- **RPA legado:** lê funcionario, empresa e departamento; tabela email apenas quando o legado não usa e-mail inline. Detecta layout por pg_attribute. CPF bytea usa pgp_sym_decrypt e LEGACY_CPF_KEY; confirmar extensão e EXECUTE no legado sem entregar escrita.
- **RPA destino:** usa workspace/cargo/unidade/usuario no singular. Worker Cloudflare atual recebe FirestoreState; tabelas rpa_sync_control, rpa_sync_users e rpa_user_links ficam para os caminhos com fallback SQL, não devem ser exigidas automaticamente para esse Worker. Instalação do controle SQL fica com migração.
- **E-mail:** consulta usuario, unidade, workspace e cargo para os colaboradores. No Node, workspaceIndex é separado e dispensa PostgreSQL. No Worker Cloudflare atual, as duas filas rodam no mesmo processo e database.connect ocorre antes do processamento; esse Worker precisa da conexão mesmo quando só existe fila de workspace. DATABASE_URL ainda é lida no bootstrap, inclusive com Hyperdrive.
- **Limpeza:** SELECT apenas em conta.firebase_uid, inclusive para revalidar UID antes da exclusão no Firebase. Não precisa de DELETE PostgreSQL. A consulta ao pai conta inclui usuario/admin por herança.
- **NR updater:** CALL ler_json_nr($1::text), compatível com a procedure text versionada. Por ser invoker, precisa dos privilégios internos do upsert em nr_catalogo. Sem DDL no runtime.
- **Tracking:** grava evento_astro, no singular; precisa de INSERT, USAGE da sequence e SELECT das colunas do RETURNING e da verificação de disponibilidade. Sem UPDATE/DELETE.

Fontes: [cloudflare/worker.ts](https://github.com/Astro-Inter/data-integration-rpa/blob/f420eef6035d293bd21d545f8ba5e9bf7bd9f3e5/cloudflare/worker.ts#L40), [cloudflare/sync-runner.ts](https://github.com/Astro-Inter/data-integration-rpa/blob/f420eef6035d293bd21d545f8ba5e9bf7bd9f3e5/cloudflare/sync-runner.ts#L35), [cloudflare-free/worker.js](https://github.com/Astro-Inter/astro-email-worker/blob/c74ef8282bd3f556f8cc02b30139c3edd8e6d469/cloudflare-free/worker.js#L25), [src/workspaceIndex.js](https://github.com/Astro-Inter/astro-email-worker/blob/c74ef8282bd3f556f8cc02b30139c3edd8e6d469/src/workspaceIndex.js#L1), [cloudflare/connectors.ts](https://github.com/Astro-Inter/astro-data-cleanup/blob/102561bb00e1e7a2b6c5b6d8d7815c801f83ce44/cloudflare/connectors.ts#L1), [cloudflare/worker.ts](https://github.com/Astro-Inter/nr-updater/blob/73a99b658d4c0c3724f5ddb412c042758e0e1b75/cloudflare/worker.ts#L181), [src/app/routes.py](https://github.com/Astro-Inter/astro-tracking-api/blob/5f35be589fabe839cb3875bd54879e9bc4b7a1cf/src/app/routes.py#L1).

## Notificações: cinco consumidores SQL ativos no código

| Worker | Objetos lidos |
| --- | --- |
| expiring-compliance | conformidade, usuario, unidade, cargo, nr_catalogo |
| expired-compliance | Os mesmos cinco |
| class-deadlines | turma_colaborador, turma, evento, usuario, unidade, cargo, conclusao_evento |
| pending-validations | Os mesmos sete |
| pending-events-push | Os mesmos sete, com firebase_uid dos destinatários |

Nenhum desses processos precisa gravar no PostgreSQL para produzir a notificação. Notificações e controle de entrega usam outros armazenamentos. missing-compliance retorna applicability_pending antes de abrir conexão: possui binding no manifest, mas não há consulta implementada a justificar privilégios de tabelas. scheduler apenas despacha jobs; delivery-control e os coordenadores usam MongoDB/SQLite de Durable Objects. chat-message-push não abre PostgreSQL. Compartilhar a role de privilégios entre leitores equivalentes é possível, mantendo logins separados por processo.

Fontes: [src/rules/queries.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/rules/queries.ts#L1), [src/push/query.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/push/query.ts#L1), [src/shared/runner.ts](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/src/shared/runner.ts#L29), [workers/chat-message-push/wrangler.jsonc](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/workers/chat-message-push/wrangler.jsonc#L1), [workers/scheduler/wrangler.jsonc](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/workers/scheduler/wrangler.jsonc#L1).

## Medallion, backup e migração

Medallion lê 12 fontes public listadas no CSV, incluindo unidade_endereco e evento_astro. No schema astro_api: SELECT em history_control/usuario_history; S/I/D em snapshots; S/I/U/D em rate_buckets; USAGE em fact_id_seq. O runtime não precisa instalar o schema nem escrever diretamente em usuario_history: migração instala as funções/triggers SECURITY DEFINER de histórico. Databricks ingest_api.py consome a API por HTTP e grava Delta, sem login PostgreSQL próprio.

Backup usa pg_dump integral no workflow; o usuário precisa conseguir ler todo o conjunto incluído no dump, inclusive logs, estruturas de controle, schemas extras e sequences. Restore/teste de recuperação usa RESTORE_PG_* e outra identidade/destino. RLS, large objects, ownership e objetos futuros precisam ser avaliados no banco real para validar a recuperação completa.

astro-database é o nome atual do repositório antes chamado banco-de-dados. Seu site estático/catalogação dispensa PostgreSQL; a função Executar Banco abre conexão e aplica DDL/DML, mantendo _astroworkspace_migrations. Este componente foi excluído da lista de provisionamento a pedido do usuário; não há proposta de login para ele nesta matriz.

Fontes: [app/snapshots.py](https://github.com/Astro-Inter/astro-medallion-api/blob/c9a40d57105ef35a286449b26b248d456531b29e/app/snapshots.py#L1), [migrations/001_history_and_snapshots.sql](https://github.com/Astro-Inter/astro-medallion-api/blob/c9a40d57105ef35a286449b26b248d456531b29e/migrations/001_history_and_snapshots.sql#L1), [databricks/ingest_api.py](https://github.com/Astro-Inter/astro-medallion-api/blob/c9a40d57105ef35a286449b26b248d456531b29e/databricks/ingest_api.py#L1), [scripts/restore_backup.sh](https://github.com/Astro-Inter/postgresql-backup/blob/787a8c150259a6b2fd81e9ecb871748b9afae35b/scripts/restore_backup.sh#L1), [server/database/adapters/postgresql-adapter.js](https://github.com/Astro-Inter/astro-database/blob/148d8950be459268beee22b11ab1a4c400a45a71/server/database/adapters/postgresql-adapter.js#L1).

## Repositórios sem consumidor PostgreSQL próprio localizado

| Repositório | Resultado / evidência representativa |
| --- | --- |
| `astro-web` | Cliente web; integra APIs por HTTP/WebSocket. [package.json](https://github.com/Astro-Inter/astro-web/blob/2960a7faf90703a19a18c54384d84f2f10910fcb/package.json#L1) |
| `astro-mobile` | Cliente Android; integra APIs. Comentário sobre ID PostgreSQL não cria conexão. [app/build.gradle.kts](https://github.com/Astro-Inter/astro-mobile/blob/757c66e951a5f386c147277087a8c27c2cb291d7/app/build.gradle.kts#L1) |
| `astro-ai-observabilidade` | Coleta observabilidade/LangSmith; menções SQL nos diagnósticos não demonstram conexão. [README.md](https://github.com/Astro-Inter/astro-ai-observabilidade/blob/86e1c01068a541994be95d09c030577dfaca86f3/README.md#L1) |
| `astro-session-summary-service` | MongoDB, Qdrant e provedores de IA; sem conexão PostgreSQL localizada. [package.json](https://github.com/Astro-Inter/astro-session-summary-service/blob/1af1e08c8bae833819fb8f0b459f4d847be2d647/package.json#L1) |
| `astro-password-reset` | Firebase e envio de e-mail; sem driver/binding PostgreSQL. Tipos Hyperdrive gerados e diagnósticos são falsos positivos. [wrangler.jsonc](https://github.com/Astro-Inter/astro-password-reset/blob/92774123f0a69b53a03e9332937b8f107af189d5/wrangler.jsonc#L1) |
| `astro-gitops` | Entrega secrets/configuração das APIs; não é consumidor SQL adicional. [apps/astro-api/secrets.env.example](https://github.com/Astro-Inter/astro-gitops/blob/4c9ea272d6c5a6d8ce4f40683749679f17229458/apps/astro-api/secrets.env.example#L1) |
| `astro-knowledge` | Documentação; nenhuma aplicação SQL própria. [README.md](https://github.com/Astro-Inter/astro-knowledge/blob/f051f16014f1b85d7d9bc7d02f37e347dacfd097/README.md#L1) |
| `astro-eqs-diagrams` | Diagramas; nenhuma aplicação SQL própria. [README.md](https://github.com/Astro-Inter/astro-eqs-diagrams/blob/946c7cd6e1fbd0ea2f9690b343f1dd237ad0c085/README.md#L1) |
| `.github` | Perfil e configurações da organização. [profile/README.md](https://github.com/Astro-Inter/.github/blob/f78e9cdf1705414dbebe65ce84ff56ee554e121e/profile/README.md#L1) |

Não criar logins PostgreSQL adicionais para esses nove componentes por causa de menções em README, tipos gerados, comentários ou códigos genéricos de diagnóstico. O acesso do GitOps aos secrets das aplicações deve ser tratado no controle da implantação.

## Onde as credenciais estão concentradas

Os manifests versionados mostram:

| Hyperdrive | Consumidores |
| --- | --- |
| 2004ed1dbe4a460495e663c42f3b801f | tracking, NR updater, cleanup, medallion, RPA destino, e-mail Cloudflare e dashboard |
| c561f75615114c0b9358bc5c35159b7d | cinco workers de notificações com SQL; missing-compliance também declara binding, mas não consulta |
| b489be2bcec844cca24a9afca3c174f6 | RPA legado |

Isso comprova compartilhamento da configuração versionada, sem comprovar usuário efetivo ou deploy atual. Para identidades independentes, cada conexão/Hyperdrive precisa apontar para o usuário correspondente. Criar logins e manter o mesmo conector compartilhado não distribui as novas credenciais aos serviços. Confirmar se os conectores apontam ao mesmo banco antes de provisionar.

Fontes: [wrangler.jsonc](https://github.com/Astro-Inter/astro-dashboard-api/blob/8d792fc991ff132314a6c9f6d40b6138ad352ec1/wrangler.jsonc#L17), [cloudflare-free/wrangler.jsonc](https://github.com/Astro-Inter/astro-email-worker/blob/c74ef8282bd3f556f8cc02b30139c3edd8e6d469/cloudflare-free/wrangler.jsonc#L32), [cloudflare/wrangler.jsonc](https://github.com/Astro-Inter/data-integration-rpa/blob/f420eef6035d293bd21d545f8ba5e9bf7bd9f3e5/cloudflare/wrangler.jsonc#L23), [workers/pending-events-push/wrangler.jsonc](https://github.com/Astro-Inter/astro-notification-service/blob/153c0fdaecf20a477d4f1ce65f771405d28510e5/workers/pending-events-push/wrangler.jsonc#L16).

## Pontos para concluir o provisionamento

1. Conferir no banco real nomes, assinaturas, sequences, owners, roles existentes, ACLs, PUBLIC, memberships e RLS. A análise não comprova usuários efetivos de produção.
2. Preparar 15 logins de runtime e 1 de backup por ambiente; manter restore separado quando utilizado. Usar roles de privilégios NOLOGIN quando facilitar a administração.
3. Conceder CONNECT no banco e USAGE nos schemas necessários, privilégios por objeto e sequences usadas. Runtime não precisa de superuser, criação de roles/bancos ou ownership geral.
4. Revisar funções invoker: EXECUTE sozinho não basta para os acessos internos. Triggers de auditoria SECURITY DEFINER registram SESSION_USER; não exigem liberar DML direto nos logs aos produtores.
5. Verificar locks da API, especialmente nr_catalogo com PESSIMISTIC_READ/FOR SHARE: além de SELECT, esses locks exigem UPDATE em pelo menos uma coluna da tabela. Não liberar escrita indiscriminada para solucionar isso. Referência: [SELECT e privilégios de locking](https://www.postgresql.org/docs/current/sql-select.html).
6. Trocar os secrets/conectores corretos e validar os fluxos com cada login em homologação, incluindo cadastro, endereço, registro diário, eventos, conformidades, notificações, RPA, NRs, snapshots e backup/restore.

## Diferenças em relação à análise de 19/10/2026

- Cobertura passa de 18 para 21 repositórios; novos dashboard, password-reset e eqs-diagrams.
- banco-de-dados foi renomeado para astro-database no remoto.
- Dashboard acrescenta consumidor PostgreSQL; password-reset e diagramas não acrescentam.
- pending-events-push acrescenta uma identidade de leitura dentro das notificações.
- API registra acesso diário e usa novas views/rotinas; unidade_endereco também precisa de UPDATE.
- IA lê evidencias/fotos e usa novas consultas operacionais, view e função de unidades.
- RPA já usa singular; Worker atual mantém estado no Firestore, com fallback SQL em outros caminhos.
- Assinatura text do NR updater já foi alinhada.
- Tracking usa evento_astro; participações usam turma_colaborador.
- Medallion inclui unidade_endereco; e-mail Cloudflare compartilha conexão com os dois fluxos.

A análise antiga foi preservada. Esta revisão usa novos snapshots e não reaproveita a matriz anterior como se continuasse atual.

## Rastreabilidade

- repositorios-analisados.json: inventário dos 21 repositórios e commits.
- matriz-servicos.csv: 16 identidades propostas, processos, objetos e conexão.
- cobertura-busca.json: arquivos/linhas com indicadores de PostgreSQL, incluindo falsos positivos que foram classificados manualmente. Não contém valores de credenciais.

Snapshots excluíram diretórios de dependências/build e arquivos maiores que 2,5 MB. A busca com ripgrep percorreu arquivos de texto disponíveis, incluindo ocultos; leitura manual concentrou-se em conexões, consultas, entidades, serviços, scripts e manifests. Ausência de conexão é uma conclusão sobre esse escopo, não prova de ausência em todo ambiente ou histórico da organização.

Referências operacionais: [GRANT e privilégios independentes de schemas/tabelas/sequences](https://www.postgresql.org/docs/current/sql-grant.html) e [configuração e rotação das credenciais de origem do Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/rotate-credentials/).

## Segunda revisão dos GRANTs

Os 21 repositórios foram consultados novamente. A lista final permanece em 11 serviços e 16 identidades. Foram corrigidos os acessos a admin/id_admin/email, a leitura de acesso no ON CONFLICT e a resolução da sequence do tracking; os grants do RPA e parte dos leitores foram restringidos por coluna. A validação descartável PostgreSQL 17 passou em 174 verificações. Ver [catálogo atualizado e limites da validação](../../database/users/README.md#segunda-revisão-e-validação-postgresql-17). Nenhuma credencial ou permissão de produção foi alterada.

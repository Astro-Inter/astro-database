# Usuários PostgreSQL por serviço

O menu **PostgreSQL → Usuários e acessos** documenta os 16 logins propostos para os 11 repositórios selecionados. `astro-database` está excluído. São 15 identidades de aplicação/job e uma de backup; a origem do RPA pertence ao banco legado.

## Arquivos e visualização

- `catalog.json`: nome, serviço, finalidade, hospedagem, conexão, objetos, evidências e condições de uso.
- Um `.sql` por usuário: criação do login e GRANTs de tabelas/colunas, schemas, rotinas e sequences usadas.
- `analyzer/users/index.js`: reúne catálogo e SQL em `generated/postgresql-users.json` para o modo local e o site estático. Rodar `npm run analyze` ou `npm run build` após editar.

Os scripts desta pasta não fazem parte dos caminhos do executor **Executar Banco**. Documentar ou abrir esta página não cria usuários nem se conecta ao PostgreSQL.

## Distribuição confirmada pelo usuário

| Hospedagem | Serviços | Configuração a atualizar na implantação |
| --- | --- | --- |
| GitHub Actions | Somente postgresql-backup | AIVEN_PG_USER / AIVEN_PG_PASSWORD |
| AWS | astro-api | POSTGRES_USER / POSTGRES_PASSWORD |
| AWS | astro-ai-api | DATABASE_URL |
| Cloudflare | Demais serviços selecionados | Credencial de origem de cada Hyperdrive e secrets do Worker quando utilizados |

O RPA possui LEGACY_DB e TARGET_DB. O dashboard usa ASTRO_DB; cleanup usa POSTGRES; outros bindings e fallbacks estão no catálogo. Não aplicar automaticamente a variante local/Python/Node se o processo implantado é o Worker. No e-mail Cloudflare, DATABASE_URL ainda é lida no bootstrap mesmo com Hyperdrive. Os recursos compartilhados devem ser separados por identidade antes de considerar a troca concluída.

## Aplicação futura

1. Confirmar banco de destino, owners, objetos, assinaturas, sequences e ACLs instaladas. Medallion depende de sua migração externa. Os logins propostos não foram verificados no banco real.
2. Rever permissões herdadas de PUBLIC/memberships. Os GRANTs são aditivos e não restringem acessos públicos preexistentes. Não executar REVOKEs globais sem inventariar os consumidores. Privilégios por serviço não substituem autorização/RLS por workspace.
3. Aplicar o script do usuário correto como administrador, uma vez. `CREATE ROLE` falha se ele já existir, evitando reaproveitar silenciosamente uma identidade com grants antigos. A transação impede aplicação parcial; definir a senha segura antes da utilização.
4. Gerar senha individual e definir por canal seguro. Não há senha padrão nem exemplo utilizável nestes arquivos.
5. Quando os usuários forem criados de verdade, entregar ao usuário um TXT no formato `nome_do_usuario: senha`, em caminho privado **fora do repositório**. O arquivo não deve entrar no Git, site, JSON gerado ou logs.
6. Atualizar secrets de AWS/GitHub Actions e conexões/secrets Cloudflare correspondentes, conforme solicitado. Validar cada serviço com a nova credencial e só então desativar a credencial anterior.

As tabelas condicionais do RPA e o layout opcional do legado ficam comentados nos scripts e descritos separadamente na interface. Aplicar apenas o bloco correspondente à implantação real. Instalação de tabelas/extensões não pertence ao runtime.

## Particularidades dos privilégios

- Funções de negócio SECURITY INVOKER exigem os acessos internos às tabelas/views além de EXECUTE. As assinaturas estão qualificadas.
- JPA materializa entidades inteiras; os grants de SELECT da API são de tabela. DML é separado por objeto, sem CRUD indiscriminado. Locks de linha exigem UPDATE em pelo menos uma coluna; a exceção do catálogo NR está documentada.
- A auditoria SECURITY DEFINER registra SESSION_USER e dispensa DML direto dos serviços nos logs. O histórico SCD Medallion também usa funções SECURITY DEFINER instaladas pela migração.
- Sequences de inserts são resolvidas com pg_get_serial_sequence; ausência da sequence interrompe a transação. Foto de perfil e acesso diário não têm sequence própria no catálogo atual.
- Backup é o único perfil com leitura integral dos schemas cobertos. RLS, large objects, schemas extras e objetos futuros exigem inventário e teste de restauração; o script não concede BYPASSRLS nem restauração.
- Os scripts não removem privilégios de outras roles nem executam alterações no banco durante o build.

Base: [análise dos serviços](../../docs/analise-acessos-postgresql-2026-11-02/analise.md), revisão estática de 02/11/2026. Antes da aplicação, validar em homologação as operações permitidas e a recusa de operações fora do perfil.

## Segunda revisão e validação PostgreSQL 17

Os 21 repositórios foram enumerados e baixados novamente. Permanecem 11 consumidores no provisionamento e 16 identidades, com astro-database excluído. O inventário dos commits e indicadores está em `revisao-repositorios.json`; os resultados dos testes estão em `validacao-grants.json`.

Foram corrigidos quatro pontos que a primeira validação estática não cobria:

- API: SELECT de `admin.id_admin` e `admin.email` na checagem derivada `existsByEmail`, além do UID da autorização.
- API: SELECT de `acesso.data` e `acesso.firebase_uid`, exigido no teste real do `ON CONFLICT` da função de acesso diário.
- Tracking: resolução de sequence pela coluna `evento_astro.id_evento`, sem derivar uma coluna inexistente `id_evento_astro`.
- API na main: UPDATE de uma coluna de `turma_colaborador`, exigido pelo FOR SHARE do trigger que valida conclusões pendentes de eventos de gestor. Validado criando evento/turma/participação/conclusão em transação descartável.

RPA destino passou a receber grants por coluna nos cadastros; a IA recebe apenas as colunas usadas de admin e evidencia. Os demais perfis foram novamente cruzados com código, rotinas e objetos.

A validação em PostgreSQL 17 descartável passou em 174 verificações, incluindo instalação dos 16 scripts, consultas originais de notificações/dashboard/e-mail/tracking, rotinas invoker de leitura e escrita, locks, upsert de NRs, triggers de auditoria/SCD, snapshots/rate limit, leitura do legado e pg_dump integral. Testes negativos verificam recusa de DML e leitura de colunas fora dos perfis. EXECUTE público das rotinas foi revogado somente no banco descartável para que a validação não dependesse de permissões implícitas. Não foram criados usuários nem alterados grants/secrets de produção.

O teste não executa as aplicações HTTP/ORM completas nem confirma o schema instalado, owners, memberships, PUBLIC, RLS, large objects ou o layout real do legado. Os blocos opcionais do legado/RPA continuam condicionais. O teste de pg_dump não equivale a um teste de restore. Não há garantia de que um ambiente com DDL ou ACLs diferentes se comporte da mesma forma.

Reprodução: `node scripts/validate-postgresql-users.mjs CAMINHO_SNAPSHOTS CAMINHO_PLANO CAMINHO_SAIDA_JSON`. Requer Docker e imagem local `postgres:17`; cria um container isolado com `--network none`, sem portas publicadas, e o encerra ao terminar. O plano JSON é a lista `{path,category}` retornada por `buildExecutionPlan(analyzeWorkspace({write:false})).items`; snapshots devem corresponder aos commits do inventário. Nenhum DSN externo é aceito.

Referências: [GRANT](https://www.postgresql.org/docs/current/sql-grant.html), [SELECT e locks](https://www.postgresql.org/docs/current/sql-select.html), [credenciais Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/rotate-credentials/).

# Relatório de justificativa — PostgreSQL

Projeto Interdisciplinar 2026 · Entrega final de Modelagem de Dados · 2 de novembro de 2026

O Astro apoia a gestão de unidades, colaboradores, treinamentos e conformidade com Normas Regulamentadoras. O PostgreSQL concentra os dados relacionais e as regras que precisam de integridade entre essas entidades. Este relatório relaciona os requisitos às evidências disponíveis no repositório e registra o que ainda precisa ser demonstrado. A presença de um script não prova, por si só, sua aplicação no ambiente em produção.

## 1. Modelagem de dados

**Banco relacional e normalização.** A separação entre workspace, unidade, cargo, usuário, catálogo de NRs, evento, turma e conformidade evita repetir dados de uma entidade em cada ocorrência. Associações como cargo–NR e unidade–NR são representadas por tabelas próprias. Essa organização busca reduzir redundância e anomalias de atualização e apoiar a 3FN; a comprovação formal de todas as dependências funcionais e a necessidade ou não de 5FN ainda devem ser documentadas. [Criação das tabelas](https://github.com/Astro-Inter/astro-database/blob/main/database/scripts/1_create_table.sql) · [Restrições e relacionamentos](https://github.com/Astro-Inter/astro-database/blob/main/database/scripts/2_constraints.sql) · [Modelos conceitual e lógico](https://github.com/Astro-Inter/astro-database/tree/main/models).

**Chaves e cardinalidades.** As constraints definem chaves primárias, estrangeiras, unicidade e validações. Por exemplo, workspace para unidade é 1:N; unidade para unidade_endereco é 1:0..1, pois a chave do endereço também referencia a unidade; cargo e NR são N:N por cargo_nr. A modelagem física do Workspace apresenta as relações extraídas do SQL. A revisão completa das cardinalidades e dos modelos publicados permanece necessária. [Constraints](https://github.com/Astro-Inter/astro-database/blob/main/database/scripts/2_constraints.sql).

**Massa de dados.** Os scripts de carga incluem usuários, unidades, cargos, eventos, turmas e conformidades, permitindo exercitar relacionamentos e regras. A existência dos arquivos não comprova que pelo menos 500 registros válidos e verossímeis foram efetivamente carregados: é necessário executar a carga em ambiente de teste, contabilizar as tabelas e registrar o resultado. A carga contém identificadores e contatos; revisar e anonimizar antes de compartilhá-la amplamente. [Scripts de carga](https://github.com/Astro-Inter/astro-database/tree/main/database/dataload).

## 2. Engenharia de dados e ETL

**Integração com o legado.** A separação entre leitura do legado e gravação no destino é refletida nos perfis propostos para a RPA. A movimentação é desenvolvida em repositório próprio; conferir o fluxo efetivamente implantado, a reconciliação de registros e o tratamento de falhas antes de afirmar o atendimento integral. [Projeto da RPA](https://github.com/Astro-Inter/data-integration-rpa) · [Perfis de acesso propostos](https://github.com/Astro-Inter/astro-database/tree/main/database/users).

**BI e transformação SQL.** As views dim_nr_catalogo e dim_resumo_funcionario organizam informações de NRs e colaboradores para análise; a segunda usa CTEs para separar seleção e agregação e ROW_NUMBER como window function. Isso evidencia transformação e função analítica, mas não demonstra sozinho um data mart completo com fato, dimensões, granularidade e relações em estrela ou floco de neve, nem um ranking de negócio ou total acumulado. Documentar e validar o modelo dimensional usado pela ferramenta de BI. [Dimensão de NRs](https://github.com/Astro-Inter/astro-database/blob/main/database/views/01_dim_nr_catalogo.sql) · [Resumo de funcionários](https://github.com/Astro-Inter/astro-database/blob/main/database/views/02_dim_resumo_funcionario.sql) · [API da camada analítica](https://github.com/Astro-Inter/astro-medallion-api).

## 3. Objetos lógicos e otimização

**Functions e procedures.** As rotinas concentram operações e regras no banco, reduzindo a duplicação de lógica: por exemplo, registro diário de acesso e criação de conformidade, além das procedures de leitura de NRs e inserção de conformidade por JSON. Há mais de duas funções e duas procedures versionadas; é necessário validar sua instalação e execução no ambiente de entrega. [Functions](https://github.com/Astro-Inter/astro-database/tree/main/database/functions) · [Procedures](https://github.com/Astro-Inter/astro-database/tree/main/database/procedures).

**Auditoria.** Triggers cobrem diversas tabelas, incluindo workspace e cargo. A função distingue operações por TG_OP, registra NEW em inserções, OLD em exclusões e os campos alterados de OLD e NEW em atualizações, usando SESSION_USER para identificar a sessão. Como UPDATE não guarda as imagens completas e o usuário registrado não é CURRENT_USER, a implementação não atende literalmente ao formato solicitado de logs completos: essa diferença deve ser alinhada ou ajustada. [Triggers](https://github.com/Astro-Inter/astro-database/blob/main/database/triggers/01_apply_log_triggers.sql) · [Função de auditoria](https://github.com/Astro-Inter/astro-database/blob/main/database/functions/01_create_log_function.sql) · [Tabelas de log](https://github.com/Astro-Inter/astro-database/blob/main/database/logs/01_create_log_table.sql).

**Otimização.** Os índices apoiam filtros e junções frequentes. A análise SCRUM-687 compara planos e tempos de consultas antes e depois de índices, com limites de interpretação registrados; os resultados não devem ser extrapolados para toda a aplicação. [Índices](https://github.com/Astro-Inter/astro-database/tree/main/database/indexes) · [Análise de performance](https://github.com/Astro-Inter/astro-database/tree/main/docs/analise-performance-SCRUM-687).

## 4. Governança de dados

**Catálogo.** Comentários SQL descrevem tabelas e colunas e alimentam o catálogo navegável do Workspace; o levantamento de usuários e grants documenta acessos propostos. Esses materiais não comprovam a existência de uma tabela técnica única com todas as colunas, regras e níveis de acesso. Consolidar e validar esse catálogo para cumprir o requisito literal. [Definições e comentários](https://github.com/Astro-Inter/astro-database/blob/main/database/scripts/1_create_table.sql) · [Usuários e acessos](https://github.com/Astro-Inter/astro-database/tree/main/database/users).

**Backup e recuperação.** O projeto possui repositório dedicado a backup. Confirmar e documentar frequência, retenção, armazenamento, responsáveis, passos de restauração e teste de recuperação antes de considerar o requisito comprovado. [PostgreSQL Backup](https://github.com/Astro-Inter/postgresql-backup).

## 5. Monitoramento de acessos

A função fn_registrar_acesso_diario recebe o Firebase UID e insere uma ocorrência por data e identidade, ignorando repetições; a autenticação e a chamada dependem da aplicação. Assim, a tabela acesso permite calcular usuários ativos por dia, respeitando a data da sessão PostgreSQL. Confirmar a implantação da migração e a chamada em todos os fluxos de acesso para comprovar a automação em operação. [Função DAU](https://github.com/Astro-Inter/astro-database/blob/main/database/functions/02_fn_registrar_acesso_diario.sql) · [Teste SQL](https://github.com/Astro-Inter/astro-database/blob/main/test/sql/registrar_acesso_diario.sql).

## 6. Estruturas avançadas

A modelagem usa herança de tabelas para representar a especialização de conta em usuário e administrador. A herança PostgreSQL tem particularidades para constraints e consultas, por isso deve ser avaliada junto aos scripts de criação e restrições. Verificar o comportamento e as garantias no ambiente efetivo. [Criação das tabelas](https://github.com/Astro-Inter/astro-database/blob/main/database/scripts/1_create_table.sql) · [Constraints](https://github.com/Astro-Inter/astro-database/blob/main/database/scripts/2_constraints.sql).

## Acesso para avaliação

Os links apontam para o repositório e projetos relacionados. A versão local pode conter alterações ainda não publicadas; os arquivos e links só refletirão esta entrega após sua publicação na branch correspondente. A equipe deve confirmar que cada professor tem acesso aos repositórios privados e às demandas específicas; este relatório não concede permissões nem comprova que elas foram liberadas.

# SCRUM-687 — Índices PostgreSQL da API e da IA

[Tarefa Jira](https://luizacursino.atlassian.net/browse/SCRUM-687) · Aba PostgreSQL → Análise de Performance (`#/performance`).

Foi mantido um índice composto compartilhado pela API e pela IA. O plano elimina a ordenação da conformidade representativa. Dois candidatos adicionais foram descartados por falta de ganho de tempo consistente. Os resultados variam entre rodadas; não houve ganho geral comprovado para toda a API ou para a resposta completa da IA.

## Medições reais

Coleta encerrada: 2026-11-02T01:59:57.403Z (UTC; 01/11/2026 em São Paulo). PostgreSQL 17.11, astro_2. Cada fase tem 3 aquecimentos + 15 EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT JSON). Medianas em ms.

A: índices originais; B: três candidatos compostos; A2: repetição sem candidatos; B2: apenas o índice escolhido. As fases B2 da tabela vêm de final-selection.json:selected_only; selected.json:final é a repetição anterior com os três candidatos.

| Consulta | A | B | A2 | B2 escolhido |
| --- | ---: | ---: | ---: | ---: |
| conformidade_representante | 0.016 | 0.010 | 0.018 | 0.022 |
| conformidade_recente | 0.016 | 0.015 | 0.014 | 0.020 |
| turmas_evento | 0.014 | 0.007 | 0.014 | 0.014 |
| meus_eventos | 0.563 | 0.366 | 0.392 | 0.384 |
| fn_carrega_home_gestor | 2.431 | 1.991 | 1.979 | 1.533 |
| fn_carrega_home_colaborador | 0.329 | 0.267 | 0.396 | 0.231 |
| fn_carrega_workspace | 2.114 | 2.796 | 1.975 | 1.873 |
| cargos | 0.689 | 0.686 | 0.695 | 0.748 |
| unidades | 4.032 | 2.548 | 1.510 | 1.333 |
| ia_situacao_nrs | 0.340 | 0.294 | 0.333 | 0.266 |
| ia_conformidade_lateral | 0.018 | 0.015 | 0.017 | 0.013 |
| ia_busca_nome | 0.129 | 0.114 | 0.116 | 0.101 |
| ia_agenda | 0.124 | 0.096 | 0.184 | 0.129 |
| ia_totais_unidade | 0.067 | 0.076 | 0.048 | 0.056 |

## Decisão

Ordena as conformidades por usuário/NR, aplicabilidade, validade e ID. Atende aplicavel = TRUE na API e aplicavel IS TRUE na IA, eliminando o Sort da busca representativa. Também pode atender ordenações que priorizam aplicável sem filtrar esse campo. O índice parcial inicial não foi escolhido para o predicado IS TRUE. O ganho absoluto na base atual é pequeno; não há comprovação de redução da latência HTTP.

```sql
CREATE INDEX IF NOT EXISTS idx_conformidade_usuario_nr_ordem
ON public.conformidade (usuario_id, nr_id, aplicavel DESC, data_validade DESC NULLS LAST, id_conformidade DESC);
```

Tamanho final: 32768 bytes. indisvalid=true, indisready=true. Nenhum índice preexistente foi removido. Não foram adicionados índices de status isolado ou busca por nome, pois não houve demonstração suficiente de benefício na base atual.

## Evidências e limites

A base é pequena e os ensaios usaram uma conexão, cache aquecido e parâmetros reais selecionados por consulta; não são teste de carga ou de escrita. As fases ocorreram em horários diferentes numa base ativa. A coleta inicial encontrou estatísticas n_live_tup desatualizadas (13 usuários estimados contra 221 contados); os números de volume exibidos são COUNT(*). Não foi executado ANALYZE de manutenção entre as fases, para não misturar seus efeitos aos dos índices. O p95 usa o método nearest-rank (15 amostras: maior valor). Hashes verificam o resultado da mesma SQL antes/depois; não validam um endpoint HTTP nem equivalência do corpo expandido com uma implementação alterada.

A cópia local da IA possui uma consulta de acesso por acesso.usuario_id; o banco atual possui firebase_uid. É uma incompatibilidade de contrato, fora do escopo de índices. Não executar essa consulta como benchmark bem-sucedido. A documentação OpenAPI foi consultada em https://ia.astro-app.sbs/openapi.json; o SQL da IA foi lido de app/modules/sst/tools.py, agenda/tools.py, support/unit_nr_recommendations.py e rh/tools.py. A identidade do usuário com NRs obrigatórias usada na confirmação final é id_usuario=17 (não há UID, nome ou email nas evidências).

A chamada inicial fn_seleciona_colaboradores com uma assinatura inexistente falhou e está preservada em benchmark.json:error; foi excluída da comparação. Não representa uma falha validada da API. As tabelas de volume são COUNT(*), não estimativas de pg_stat_user_tables. Resultados retornados foram comparados por SHA-256; os valores não foram publicados.

## Arquivos e reprodução

- inventory.json: catálogo inicial, volumes estimados e índices existentes; benchmark.json: primeiro ensaio, com 21 repetições por cenário.
- confirmation.json: candidato parcial, incluindo IA; selected.json: versão composta em quatro fases; final-selection.json: estado final com somente o índice escolhido.
- manifest.json: proveniência das fases, validação, descartes e limitações.
- apply.sql: deploy CONCURRENTLY fora de transação; rollback.sql: reversão do índice criado. O arquivo em database/indexes usa CREATE INDEX sem CONCURRENTLY para o executor transacional.

```powershell
node --env-file="CAMINHO_DA_ENV_DA_API" scripts/benchmark-scrum687.cjs
```

A reprodução abre transação READ ONLY e mede apenas o estado atual. Use PGSSLROOTCERT com a CA do provedor; a coleta experimental usou TLS com rejectUnauthorized=false, conforme o adaptador já existente no projeto. A reprodução só aceita esse modo explicitamente com SCRUM687_ALLOW_PRIVATE_CA=true. O script não imprime credenciais ou filtros pessoais, não salva planos e não publica uma nova medição automaticamente. Parâmetros numéricos da coleta estão nas SQLs; os placeholders pessoais são resolvidos por subconsultas locais.

O custo adicional de escrita não foi medido, pois a análise não modificou dados de negócio. O índice acrescenta 32 KiB e deve ser reavaliado com crescimento/carga real. Não há teste HTTP de antes/depois nem teste de geração da IA.

Fontes: [Using EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html), [CREATE INDEX](https://www.postgresql.org/docs/17/sql-createindex.html).

## Validação final

153 testes existentes passaram; build estático e reprodução das 14 consultas em READ ONLY passaram. validation.json confirma que os 51 índices originais foram preservados e somente o índice escolhido permanece entre os candidatos da tarefa. A nova rota foi aberta no navegador e sua tabela foi conferida.

As evidências JSON compactas conservam todas as amostras de tempo e o primeiro plano medido por fase. Os arquivos `.json.gz` correspondentes guardam a captura integral original, com todos os planos repetidos, sem perda de dados.

O índice foi renomeado após a coleta para `idx_conformidade_usuario_nr_ordem`, sem reconstrução. As evidências históricas preservam o nome antigo; a tela mostra o nome atual. A validade após a alteração está em rename-validation.json.

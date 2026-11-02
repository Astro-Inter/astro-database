# Análise de índices MongoDB — API Java e IA

Foi aplicado um índice novo no chat Java. Na paginação de 10 mensagens, o trabalho de leitura caiu de 111 para 10 documentos e o Sort bloqueante foi eliminado. Para a IA, os índices úteis de sessões e notificações já existiam; não houve justificativa para acrescentar outro. Não foi comprovada uma queda do tempo total de resposta HTTP ou do LLM.

MongoDB 8.0.36, database astro. Coleta final: 2026-11-02T02:39:58.162420+00:00 (UTC; 01/11/2026 em São Paulo).

Aba no site: **MongoDB → Análise de índices** (`#/mongo-performance`).

## Método

Foram avaliadas 16 consultas de leitura extraídas dos repositories Java e Python; o pipeline de listagem de sessões foi extraído da AST do código local. A confirmação usa os filtros, tipos BSON, projeções e sort atuais, com 2 aquecimentos e 11 explain executionStats por consulta e fase. O planner escolheu livremente, sem hint nos benchmarks. queryPlanner também foi coletado. Foram comparados os hashes do conjunto de resultados; nas nove consultas com ordenação determinística foi verificada separadamente a sequência contra uma varredura com hint natural, apenas como controle de correção.

Base pequena e ativa, cache aquecido, uma conexão e parâmetros reais amostrados; sem carga sintética e sem teste de escrita. executionTimeMillis tem resolução inteira em ms, e a mediana foi 0 na maioria das consultas antes e depois; não comprova melhora de latência. A mediana de ida/volta inclui rede/driver/explain e variou nos controles. p95 nearest-rank de 11 amostras corresponde ao maior valor. Não foram modificados documentos, habilitado profiler ou alterados índices originais. O custo adicional de escrita não foi medido. IDs de conversa, sessão e UIDs foram substituídos por placeholders; payloads pessoais não foram exportados. O ensaio inicial usou limite 100 em NRs; a confirmação corrigiu para MAX_NR_CANDIDATES=50 do código, sobre uma collection de 38 documentos.

## Resultado final

db.mensagens.createIndex(
  { conversa_id: 1, data: -1, _id: -1 },
  { name: "idx_mensagens_conversa_data_id" }
);

Tamanho no momento da validação: 24576 bytes (24 KiB). Os 20 índices originais foram preservados. Nenhum documento foi alterado pela análise. Os outros três candidatos foram removidos.

| Consulta | Docs antes | Docs depois | Keys antes | Keys depois | Retornados | Sort antes/depois | Mediana explain antes/depois (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| java_chat_primeira_pagina | 111 | 10 | 0 | 10 | 10 | True/False | 0/0 |
| java_chat_cursor | 111 | 10 | 0 | 10 | 10 | True/False | 0/0 |
| java_chat_por_id | 1 | 1 | 1 | 1 | 1 | False/False | 0/0 |
| java_chat_ultima_por_conversa | 111 | 107 | 0 | 107 | 2 | True/False | 0/0 |
| java_conversas_usuario | 4 | 4 | 0 | 0 | 2 | False/False | 0/0 |
| java_conversa_par | 4 | 4 | 0 | 0 | 1 | False/False | 0/0 |
| java_notificacoes_home | 3 | 3 | 3 | 3 | 3 | False/False | 0/0 |
| ia_notificacoes | 5 | 5 | 5 | 5 | 5 | False/False | 0/0 |
| java_formularios_recebidos | 8 | 8 | 0 | 0 | 5 | True/True | 0/0 |
| java_formularios_home | 8 | 8 | 0 | 0 | 1 | True/True | 0/0 |
| ia_sessoes_lista | 11 | 11 | 11 | 11 | 11 | False/False | 0/0 |
| ia_memoria_resumos | 20 | 20 | 21 | 21 | 0 | False/False | 1/1 |
| ia_sessao_por_id | 1 | 1 | 1 | 1 | 1 | False/False | 0/0 |
| java_nr_catalogo | 38 | 38 | 38 | 38 | 38 | False/False | 0/0 |
| ia_nrs_candidatas | 38 | 38 | 38 | 38 | 10 | False/False | 0/0 |
| ia_historico_par_sem_campo | 0 | 0 | 0 | 0 | 0 | True/True | 0/0 |

Os dois cenários de paginação do chat tiveram redução de 90,99% nos documentos examinados (111 para 10), com o mesmo resultado ordenado. Na consulta da última mensagem de várias conversas, o índice elimina o Sort bloqueante, mas ainda examina 107 documentos; não é o mesmo ganho da paginação.

## Decisões por collection

### mensagens — um índice novo aplicado

idx_mensagens_conversa_data_id: conversa_id (igualdade), data e _id (ordem). Na paginação, reduz 111 para 10 documentos examinados e remove o SORT bloqueante. A busca por ID continua atendida pelo _id_. Na última mensagem por conversa, o plano usa SORT_MERGE e ainda examina 107 documentos para dois grupos; não se deve atribuir a ela o ganho da paginação.

### conversas — candidato descartado

O multikey participantes_ids reduziu 4 para 2 documentos na listagem e 4 para 1 na busca pelo par, mas os tempos não mostraram ganho consistente e a collection tem só quatro documentos. Não foi mantido; reavaliar ao crescer.

### formularios — candidato descartado

O composto workspace_id/gestor_id/criado_em/_id eliminou Sort da listagem recebida e reduziu 8 para 5 documentos, mas não demonstrou redução consistente de tempo que justificasse mais um índice nesta base pequena. O Sort calculado _due_date_missing da Home permaneceu. Não foi mantido.

### nrs e nrs_pendentes — sem índice adicional

O candidato usabilidade/_id não foi escolhido para a consulta da IA com regex case-insensitive e revogada != true. A leitura de 38 NRs permaneceu apoiada no _id_. Busca direta por número e ordenação por _id já são atendidas. Sem criar índice para os dois documentos pendentes.

### sessoes — índices existentes preservados

sessoes_usuario_atualizacao já atende a listagem ordenada e paginação por cursor; historico_usuario e os índices de inatividade foram preservados. A amostra de recuperação de resumos retornou zero elegíveis, apesar de existir um documento com resumo não vazio; não há base para alegar ganho na recuperação de memória.

### notificacoes — índice compartilhado existente

idx_notificacoes_usuario_criacao atende Java e IA, sem Sort e examinando 3 e 5 documentos respectivamente. O unique parcial de deduplicação é uma garantia de integridade e foi preservado mesmo com zero acessos registrados no período.

### fila_entregas_chat — índices existentes preservados

concluida/proxima_tentativa_em já registra uso operacional. expira_em é TTL e pode ter zero acessos em $indexStats sem ser inútil. A análise não alterou retenção nem criou um novo TTL.

### configuracoes_paineis e sincronizacoes_catalogo_nrs — sem candidato

Um e zero documentos, respectivamente. Não foram encontrados caminhos de consulta relevantes da API Java/IA que justificassem outro índice neste escopo; o _id_ foi preservado.

## IA e cobertura da amostra

API e IA usam a mesma URI/database (comparação local; credenciais não publicadas). As 111 mensagens observadas têm conversa_id e não têm destinatario_id, enquanto a consulta de histórico da IA espera remetente/destinatário explícitos. Isso retorna zero documentos; não foi tratada como prova de aceleração. É necessário alinhar essa consulta ao modelo de conversas, mantendo autorização de participantes, em uma mudança funcional própria.

Na recuperação de memória, havia um resumo não vazio, mas nenhum elegível pelos critérios atuais; a consulta retornou zero. A análise não criou um índice baseado nesse resultado nem alterou as regras de memória. Os índices de sessões e notificações já atendem os filtros/ordem úteis.

## Material fornecido e conferência técnica

Foi lido e inspecionado o material NoSQL12 - MongoDB_indices.pdf, especialmente páginas 5, 11 e 14–30. Caminho fornecido: C:/Users/lucaslima-ieg/OneDrive - Instituto J&F/Área de Trabalho/Pastas Germinare/Banco de dados/Slides - Conteúdo/NoSQL12 - MongoDB_indices.pdf. O PDF original não foi copiado para o repositório.

Foram usados explain executionStats, ESR, multikey, consulta coberta, partial e custo de índices. Ajuste à página 11: {nome:1,cpf:1} também pode atender busca apenas por nome porque nome é prefixo; não é necessário filtrar sempre pelos dois campos. COLLSCAN pode ser adequado em collections pequenas; SORT não é eliminado por qualquer índice arbitrário. Nenhum TTL novo foi criado para obter performance, pois TTL modifica a política de retenção.

Referências oficiais: [Explain Results v8.0](https://www.mongodb.com/docs/v8.0/reference/explain-results/), [índices e prefixos](https://www.mongodb.com/docs/v8.0/data-modeling/schema-design-process/create-indexes/).

## Evidências e reprodução

- inventory.json: collections, contagens, definições e uso de índices existentes; somente nomes de campos/tipos amostrados, sem payloads.
- benchmark.json: ensaio inicial com os quatro candidatos; o limite de NRs foi 100 nessa exploração.
- confirmation.json: confirmação sem candidatos e duas rodadas com somente o escolhido; limite de NRs corrigido para 50 do código. Há 11 amostras por consulta/fase, queryPlanner e um plano executionStats representativo.
- validation.json: índice final visível, tamanho, ordem de nove consultas comparada contra varredura natural e cobertura de tipos dos campos.
- scenarios.json e replay.py: reprodução de explain sem criar/remover índices e sem imprimir documentos. Dependência: pymongo (requirements.txt). Resolução dinâmica dos IDs de conversa/sessão; outros IDs numéricos mantêm os parâmetros observados.

```powershell
python mongo/analysis/performance/replay.py --env-file "CAMINHO_DA_ENV_DA_API"
```

Os scripts em mongo/indexes podem ser executados com mongosh na database correta: 01_mensagens_conversa_data_id.js aplica de forma idempotente e valida a definição; rollback_mensagens_conversa_data_id.js remove apenas o índice desta análise se sua definição ainda corresponder. Os scripts não são executados automaticamente pelo site ou pelo build.

Os resultados se aplicam às consultas e dados amostrados. O volume atual é pequeno e não houve teste de carga, escrita, endpoint HTTP, busca vetorial ou geração LLM. Não há porcentagem comprovada de redução de latência da API ou da IA.

## Validação da documentação

Os 153 testes existentes passaram, o build estático passou e a reprodução das 16 consultas foi executada com sucesso. As amostras/medianas foram conferidas contra os arquivos de evidência. A rota #/mongo-performance e seus valores foram conferidos no navegador.

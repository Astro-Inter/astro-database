export const mongoPerformanceReport = {
  "version": "8.0.36",
  "database": "astro",
  "measuredAt": "2026-11-02T02:39:58.162420+00:00",
  "conclusion": "Foi aplicado um índice novo no chat Java. Na paginação de 10 mensagens, o trabalho de leitura caiu de 111 para 10 documentos e o Sort bloqueante foi eliminado. Para a IA, os índices úteis de sessões e notificações já existiam; não houve justificativa para acrescentar outro. Não foi comprovada uma queda do tempo total de resposta HTTP ou do LLM.",
  "method": "Foram avaliadas 16 consultas de leitura extraídas dos repositories Java e Python; o pipeline de listagem de sessões foi extraído da AST do código local. A confirmação usa os filtros, tipos BSON, projeções e sort atuais, com 2 aquecimentos e 11 explain executionStats por consulta e fase. O planner escolheu livremente, sem hint nos benchmarks. queryPlanner também foi coletado. Foram comparados os hashes do conjunto de resultados; nas nove consultas com ordenação determinística foi verificada separadamente a sequência contra uma varredura com hint natural, apenas como controle de correção.",
  "limitations": "Base pequena e ativa, cache aquecido, uma conexão e parâmetros reais amostrados; sem carga sintética e sem teste de escrita. executionTimeMillis tem resolução inteira em ms, e a mediana foi 0 na maioria das consultas antes e depois; não comprova melhora de latência. A mediana de ida/volta inclui rede/driver/explain e variou nos controles. p95 nearest-rank de 11 amostras corresponde ao maior valor. Não foram modificados documentos, habilitado profiler ou alterados índices originais. O custo adicional de escrita não foi medido. IDs de conversa, sessão e UIDs foram substituídos por placeholders; payloads pessoais não foram exportados. O ensaio inicial usou limite 100 em NRs; a confirmação corrigiu para MAX_NR_CANDIDATES=50 do código, sobre uma collection de 38 documentos.",
  "createIndex": "db.mensagens.createIndex(\n  { conversa_id: 1, data: -1, _id: -1 },\n  { name: \"idx_mensagens_conversa_data_id\" }\n);",
  "counts": [
    {
      "name": "configuracoes_paineis",
      "count": 1
    },
    {
      "name": "conversas",
      "count": 4
    },
    {
      "name": "fila_entregas_chat",
      "count": 39
    },
    {
      "name": "formularios",
      "count": 8
    },
    {
      "name": "mensagens",
      "count": 111
    },
    {
      "name": "notificacoes",
      "count": 104
    },
    {
      "name": "nrs",
      "count": 38
    },
    {
      "name": "nrs_pendentes",
      "count": 2
    },
    {
      "name": "sessoes",
      "count": 95
    },
    {
      "name": "sincronizacoes_catalogo_nrs",
      "count": 0
    }
  ],
  "decisions": [
    {
      "collection": "mensagens",
      "status": "um índice novo aplicado",
      "reason": "idx_mensagens_conversa_data_id: conversa_id (igualdade), data e _id (ordem). Na paginação, reduz 111 para 10 documentos examinados e remove o SORT bloqueante. A busca por ID continua atendida pelo _id_. Na última mensagem por conversa, o plano usa SORT_MERGE e ainda examina 107 documentos para dois grupos; não se deve atribuir a ela o ganho da paginação."
    },
    {
      "collection": "conversas",
      "status": "candidato descartado",
      "reason": "O multikey participantes_ids reduziu 4 para 2 documentos na listagem e 4 para 1 na busca pelo par, mas os tempos não mostraram ganho consistente e a collection tem só quatro documentos. Não foi mantido; reavaliar ao crescer."
    },
    {
      "collection": "formularios",
      "status": "candidato descartado",
      "reason": "O composto workspace_id/gestor_id/criado_em/_id eliminou Sort da listagem recebida e reduziu 8 para 5 documentos, mas não demonstrou redução consistente de tempo que justificasse mais um índice nesta base pequena. O Sort calculado _due_date_missing da Home permaneceu. Não foi mantido."
    },
    {
      "collection": "nrs e nrs_pendentes",
      "status": "sem índice adicional",
      "reason": "O candidato usabilidade/_id não foi escolhido para a consulta da IA com regex case-insensitive e revogada != true. A leitura de 38 NRs permaneceu apoiada no _id_. Busca direta por número e ordenação por _id já são atendidas. Sem criar índice para os dois documentos pendentes."
    },
    {
      "collection": "sessoes",
      "status": "índices existentes preservados",
      "reason": "sessoes_usuario_atualizacao já atende a listagem ordenada e paginação por cursor; historico_usuario e os índices de inatividade foram preservados. A amostra de recuperação de resumos retornou zero elegíveis, apesar de existir um documento com resumo não vazio; não há base para alegar ganho na recuperação de memória."
    },
    {
      "collection": "notificacoes",
      "status": "índice compartilhado existente",
      "reason": "idx_notificacoes_usuario_criacao atende Java e IA, sem Sort e examinando 3 e 5 documentos respectivamente. O unique parcial de deduplicação é uma garantia de integridade e foi preservado mesmo com zero acessos registrados no período."
    },
    {
      "collection": "fila_entregas_chat",
      "status": "índices existentes preservados",
      "reason": "concluida/proxima_tentativa_em já registra uso operacional. expira_em é TTL e pode ter zero acessos em $indexStats sem ser inútil. A análise não alterou retenção nem criou um novo TTL."
    },
    {
      "collection": "configuracoes_paineis e sincronizacoes_catalogo_nrs",
      "status": "sem candidato",
      "reason": "Um e zero documentos, respectivamente. Não foram encontrados caminhos de consulta relevantes da API Java/IA que justificassem outro índice neste escopo; o _id_ foi preservado."
    }
  ],
  "validation": {
    "verifiedAt": "2026-11-02T02:39:58.122678+00:00",
    "originalIndexesPreserved": true,
    "originalIndexCount": 20,
    "selectedIndex": {
      "v": 2,
      "key": {
        "conversa_id": 1,
        "data": -1,
        "_id": -1
      },
      "name": "idx_mensagens_conversa_data_id"
    },
    "sizeBytes": 24576,
    "discardedAbsent": true,
    "businessDocumentsModifiedByAnalysis": false
  },
  "workloads": [
    {
      "id": "java_chat_primeira_pagina",
      "collection": "mensagens",
      "source": "ChatMongoRepository.findMessagesBefore",
      "command": {
        "find": "mensagens",
        "filter": {
          "conversa_id": "<CONVERSATION>"
        },
        "sort": {
          "data": -1,
          "_id": -1
        },
        "limit": 10,
        "projection": {
          "_id": 1,
          "remetente_id": 1,
          "mensagem": 1,
          "resposta_mensagem_id": 1,
          "data": 1
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.66,
          "resultHash": "abbbfa04d58ad4b0a009649c378cf2b4443fd3a25bc7a6910f48f16ff929bed0",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 111,
            "totalKeysExamined": 0,
            "nReturned": 10,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE",
              "SORT"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.884
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.669,
          "resultHash": "abbbfa04d58ad4b0a009649c378cf2b4443fd3a25bc7a6910f48f16ff929bed0",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 10,
            "totalKeysExamined": 10,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "idx_mensagens_conversa_data_id"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.412
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.755,
          "resultHash": "abbbfa04d58ad4b0a009649c378cf2b4443fd3a25bc7a6910f48f16ff929bed0",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 10,
            "totalKeysExamined": 10,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "idx_mensagens_conversa_data_id"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.359
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · mensagens, primeira página"
    },
    {
      "id": "java_chat_cursor",
      "collection": "mensagens",
      "source": "ChatMongoRepository.findMessagesBefore (cursor real da página anterior)",
      "command": {
        "find": "mensagens",
        "filter": {
          "$and": [
            {
              "conversa_id": "<CONVERSATION>"
            },
            {
              "$or": [
                {
                  "data": {
                    "$lt": {
                      "$date": "2026-11-01T19:55:29.622Z"
                    }
                  }
                },
                {
                  "data": {
                    "$date": "2026-11-01T19:55:29.622Z"
                  },
                  "_id": {
                    "$lt": "<CURSORID>"
                  }
                }
              ]
            }
          ]
        },
        "sort": {
          "data": -1,
          "_id": -1
        },
        "limit": 10,
        "projection": {
          "_id": 1,
          "remetente_id": 1,
          "mensagem": 1,
          "resposta_mensagem_id": 1,
          "data": 1
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 1,
          "medianRoundtripMs": 7.245,
          "resultHash": "e0c0e4ca2fba20ea9f8ffdcc390fa22ac1c08de3b51561ea958836566c8743d3",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 111,
            "totalKeysExamined": 0,
            "nReturned": 10,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE",
              "SORT"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.615
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 7.271,
          "resultHash": "e0c0e4ca2fba20ea9f8ffdcc390fa22ac1c08de3b51561ea958836566c8743d3",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 10,
            "totalKeysExamined": 10,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE",
              "SORT_MERGE"
            ],
            "indexes": [
              "idx_mensagens_conversa_data_id"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.741
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.908,
          "resultHash": "e0c0e4ca2fba20ea9f8ffdcc390fa22ac1c08de3b51561ea958836566c8743d3",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 10,
            "totalKeysExamined": 10,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE",
              "SORT_MERGE"
            ],
            "indexes": [
              "idx_mensagens_conversa_data_id"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.171
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · mensagens, página com cursor"
    },
    {
      "id": "java_chat_por_id",
      "collection": "mensagens",
      "source": "ChatMongoRepository.findMessage",
      "command": {
        "find": "mensagens",
        "filter": {
          "_id": "<IDENTIFIER_1>",
          "conversa_id": "<CONVERSATION>"
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.316,
          "resultHash": "c186ea6f80f7f98841e5dcbb3a4530b3eaa4f633a70082a4113eed17c07fdcfc",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 1,
            "totalKeysExamined": 1,
            "nReturned": 1,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.994
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.332,
          "resultHash": "c186ea6f80f7f98841e5dcbb3a4530b3eaa4f633a70082a4113eed17c07fdcfc",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 1,
            "totalKeysExamined": 1,
            "nReturned": 1,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.573
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.878,
          "resultHash": "c186ea6f80f7f98841e5dcbb3a4530b3eaa4f633a70082a4113eed17c07fdcfc",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 1,
            "totalKeysExamined": 1,
            "nReturned": 1,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.806
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · mensagem por ID"
    },
    {
      "id": "java_chat_ultima_por_conversa",
      "collection": "mensagens",
      "source": "ChatMongoRepository.findLatestMessages",
      "command": {
        "aggregate": "mensagens",
        "pipeline": [
          {
            "$match": {
              "conversa_id": {
                "$in": [
                  "<CONVERSATION>",
                  "<IDENTIFIER_2>"
                ]
              }
            }
          },
          {
            "$sort": {
              "data": -1,
              "_id": -1
            }
          },
          {
            "$group": {
              "_id": "$conversa_id",
              "senderId": {
                "$first": "$remetente_id"
              },
              "content": {
                "$first": "$mensagem"
              },
              "date": {
                "$first": "$data"
              }
            }
          },
          {
            "$project": {
              "senderId": 1,
              "content": 1,
              "date": 1,
              "conversationId": "$_id"
            }
          }
        ],
        "cursor": {}
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 7.114,
          "resultHash": "d3bba898e98429328ff98249a58905e7107811e4fe4d073eaf4046e709d989ae",
          "resultCount": 2,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 111,
            "totalKeysExamined": 0,
            "nReturned": 2,
            "stages": [
              "COLLSCAN",
              "GROUP",
              "SORT"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.884
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 1,
          "medianRoundtripMs": 7.284,
          "resultHash": "d3bba898e98429328ff98249a58905e7107811e4fe4d073eaf4046e709d989ae",
          "resultCount": 2,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 107,
            "totalKeysExamined": 107,
            "nReturned": 2,
            "stages": [
              "FETCH",
              "GROUP",
              "IXSCAN",
              "SORT_MERGE"
            ],
            "indexes": [
              "idx_mensagens_conversa_data_id"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.141
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 1,
          "medianRoundtripMs": 7.355,
          "resultHash": "d3bba898e98429328ff98249a58905e7107811e4fe4d073eaf4046e709d989ae",
          "resultCount": 2,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 107,
            "totalKeysExamined": 107,
            "nReturned": 2,
            "stages": [
              "FETCH",
              "GROUP",
              "IXSCAN",
              "SORT_MERGE"
            ],
            "indexes": [
              "idx_mensagens_conversa_data_id"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.308
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · última mensagem por conversa"
    },
    {
      "id": "java_conversas_usuario",
      "collection": "conversas",
      "source": "ChatMongoRepository.findConversationsFor",
      "command": {
        "find": "conversas",
        "filter": {
          "participantes_ids": {
            "$eq": 2,
            "$size": 2
          }
        },
        "projection": {
          "_id": 1,
          "participantes_ids": 1
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.994,
          "resultHash": "285df5d0985e0cc93a28deb428178e2e109e272875a6bd5cb04df9e23ca54edd",
          "resultCount": 2,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 4,
            "totalKeysExamined": 0,
            "nReturned": 2,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.212
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.025,
          "resultHash": "285df5d0985e0cc93a28deb428178e2e109e272875a6bd5cb04df9e23ca54edd",
          "resultCount": 2,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 4,
            "totalKeysExamined": 0,
            "nReturned": 2,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.795
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.733,
          "resultHash": "285df5d0985e0cc93a28deb428178e2e109e272875a6bd5cb04df9e23ca54edd",
          "resultCount": 2,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 4,
            "totalKeysExamined": 0,
            "nReturned": 2,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.664
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · conversas por participante"
    },
    {
      "id": "java_conversa_par",
      "collection": "conversas",
      "source": "ChatMongoRepository.findConversationByPair",
      "command": {
        "find": "conversas",
        "filter": {
          "participantes_ids": {
            "$all": [
              2,
              5
            ],
            "$size": 2
          }
        },
        "limit": 2
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.903,
          "resultHash": "71b802d87150423101bfbce3c56bacdebb494cee51e2b1b13a646b7dd472574b",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 4,
            "totalKeysExamined": 0,
            "nReturned": 1,
            "stages": [
              "COLLSCAN",
              "LIMIT"
            ],
            "indexes": [],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.949
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.893,
          "resultHash": "71b802d87150423101bfbce3c56bacdebb494cee51e2b1b13a646b7dd472574b",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 4,
            "totalKeysExamined": 0,
            "nReturned": 1,
            "stages": [
              "COLLSCAN",
              "LIMIT"
            ],
            "indexes": [],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.893
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.649,
          "resultHash": "71b802d87150423101bfbce3c56bacdebb494cee51e2b1b13a646b7dd472574b",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 4,
            "totalKeysExamined": 0,
            "nReturned": 1,
            "stages": [
              "COLLSCAN",
              "LIMIT"
            ],
            "indexes": [],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.025
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · conversa pelo par"
    },
    {
      "id": "java_notificacoes_home",
      "collection": "notificacoes",
      "source": "NotificationRepository.findTop3ByUserIdOrderByCreatedAtDescIdDesc",
      "command": {
        "find": "notificacoes",
        "filter": {
          "usuario_id": 9
        },
        "sort": {
          "data_criacao": -1,
          "_id": -1
        },
        "limit": 3
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.936,
          "resultHash": "108d83e906c1d4e8f1f0829c8c781724459a64bb7a936c2c73461a84f595da29",
          "resultCount": 3,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 3,
            "totalKeysExamined": 3,
            "nReturned": 3,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT"
            ],
            "indexes": [
              "idx_notificacoes_usuario_criacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.909
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.061,
          "resultHash": "108d83e906c1d4e8f1f0829c8c781724459a64bb7a936c2c73461a84f595da29",
          "resultCount": 3,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 3,
            "totalKeysExamined": 3,
            "nReturned": 3,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT"
            ],
            "indexes": [
              "idx_notificacoes_usuario_criacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.828
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.056,
          "resultHash": "108d83e906c1d4e8f1f0829c8c781724459a64bb7a936c2c73461a84f595da29",
          "resultCount": 3,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 3,
            "totalKeysExamined": 3,
            "nReturned": 3,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT"
            ],
            "indexes": [
              "idx_notificacoes_usuario_criacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.758
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · três notificações da Home"
    },
    {
      "id": "ia_notificacoes",
      "collection": "notificacoes",
      "source": "roteador/tools.py:consultar_notificacoes",
      "command": {
        "find": "notificacoes",
        "filter": {
          "usuario_id": 9
        },
        "sort": {
          "data_criacao": -1,
          "_id": -1
        },
        "limit": 5,
        "projection": {
          "_id": 0,
          "mensagem": 1,
          "data_criacao": 1
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.298,
          "resultHash": "f439d9a9bb263a4ff0205288fcfc5af6754c76babc88d3c04179d8bb6443067d",
          "resultCount": 5,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 5,
            "totalKeysExamined": 5,
            "nReturned": 5,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "idx_notificacoes_usuario_criacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.897
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.386,
          "resultHash": "f439d9a9bb263a4ff0205288fcfc5af6754c76babc88d3c04179d8bb6443067d",
          "resultCount": 5,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 5,
            "totalKeysExamined": 5,
            "nReturned": 5,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "idx_notificacoes_usuario_criacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 260.848
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.323,
          "resultHash": "f439d9a9bb263a4ff0205288fcfc5af6754c76babc88d3c04179d8bb6443067d",
          "resultCount": 5,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 5,
            "totalKeysExamined": 5,
            "nReturned": 5,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "idx_notificacoes_usuario_criacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.68
          }
        }
      },
      "resultsEqual": true,
      "title": "IA · notificações"
    },
    {
      "id": "java_formularios_recebidos",
      "collection": "formularios",
      "source": "FormRepositoryCustomImpl.findReceived (destinatário)",
      "command": {
        "find": "formularios",
        "filter": {
          "$and": [
            {
              "workspace_id": 1
            },
            {
              "gestor_id": 3
            },
            {
              "status": {
                "$in": [
                  "PENDENTE",
                  "CONCLUIDO"
                ]
              }
            }
          ]
        },
        "sort": {
          "criado_em": -1,
          "_id": -1
        },
        "limit": 10,
        "projection": {
          "_id": 1,
          "titulo": 1,
          "descricao": 1,
          "nr_id": 1,
          "unidade_id": 1,
          "gestor_remetente_id": 1,
          "data_limite": 1,
          "criado_em": 1,
          "respondido_em": 1,
          "status": 1,
          "analise": 1,
          "configuracao": 1,
          "perguntas.pergunta_id": 1
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.248,
          "resultHash": "faed08a7854965fbc64d7430655cad3eecd328bf6c0e4caa1e1ff4c65fca0a58",
          "resultCount": 5,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 8,
            "totalKeysExamined": 0,
            "nReturned": 5,
            "stages": [
              "COLLSCAN",
              "PROJECTION_DEFAULT",
              "SORT"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 20.089
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.057,
          "resultHash": "faed08a7854965fbc64d7430655cad3eecd328bf6c0e4caa1e1ff4c65fca0a58",
          "resultCount": 5,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 8,
            "totalKeysExamined": 0,
            "nReturned": 5,
            "stages": [
              "COLLSCAN",
              "PROJECTION_DEFAULT",
              "SORT"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.418
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.502,
          "resultHash": "faed08a7854965fbc64d7430655cad3eecd328bf6c0e4caa1e1ff4c65fca0a58",
          "resultCount": 5,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 8,
            "totalKeysExamined": 0,
            "nReturned": 5,
            "stages": [
              "COLLSCAN",
              "PROJECTION_DEFAULT",
              "SORT"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 5.818
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · formulários recebidos"
    },
    {
      "id": "java_formularios_home",
      "collection": "formularios",
      "source": "FormRepository.findTop3PendingByManagerId",
      "command": {
        "aggregate": "formularios",
        "pipeline": [
          {
            "$match": {
              "gestor_id": 3,
              "status": "PENDENTE"
            }
          },
          {
            "$addFields": {
              "_due_date_missing": {
                "$cond": [
                  {
                    "$eq": [
                      {
                        "$ifNull": [
                          "$data_limite",
                          null
                        ]
                      },
                      null
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          },
          {
            "$sort": {
              "_due_date_missing": 1,
              "data_limite": 1,
              "_id": 1
            }
          },
          {
            "$limit": 3
          },
          {
            "$project": {
              "_id": 1,
              "titulo": 1,
              "data_limite": 1
            }
          }
        ],
        "cursor": {}
      },
      "note": "A chave de ordenação calculada _due_date_missing não existe no documento; o índice não elimina este Sort.",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.582,
          "resultHash": "094236bf7cecf79ed659bf4867834bdcfdfe324b8813e9744adfd4212a41f624",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 8,
            "totalKeysExamined": 0,
            "nReturned": 1,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 5.984
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 8.089,
          "resultHash": "094236bf7cecf79ed659bf4867834bdcfdfe324b8813e9744adfd4212a41f624",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 8,
            "totalKeysExamined": 0,
            "nReturned": 1,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.743
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.569,
          "resultHash": "094236bf7cecf79ed659bf4867834bdcfdfe324b8813e9744adfd4212a41f624",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 8,
            "totalKeysExamined": 0,
            "nReturned": 1,
            "stages": [
              "COLLSCAN",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.415
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · formulários pendentes da Home"
    },
    {
      "id": "ia_sessoes_lista",
      "collection": "sessoes",
      "source": "database/sessions.py:MongoSessions.list_sessions (pipeline extraído do código)",
      "command": {
        "aggregate": "sessoes",
        "pipeline": [
          {
            "$match": {
              "usuario_id": "<SESSIONUID>"
            }
          },
          {
            "$sort": {
              "atualizada_em": -1,
              "_id": -1
            }
          },
          {
            "$limit": 11
          },
          {
            "$project": {
              "iniciada_em": 1,
              "atualizada_em": 1,
              "status": 1,
              "titulo": 1,
              "ultima_mensagem_previa": 1,
              "primeira_pergunta": {
                "$arrayElemAt": [
                  {
                    "$filter": {
                      "input": {
                        "$ifNull": [
                          "$mensagens",
                          []
                        ]
                      },
                      "as": "message",
                      "cond": {
                        "$and": [
                          {
                            "$eq": [
                              "$$message.papel",
                              "human"
                            ]
                          },
                          {
                            "$eq": [
                              {
                                "$type": "$$message.conteudo"
                              },
                              "string"
                            ]
                          }
                        ]
                      }
                    }
                  },
                  0
                ]
              },
              "ultima_mensagem": {
                "$arrayElemAt": [
                  {
                    "$filter": {
                      "input": {
                        "$ifNull": [
                          "$mensagens",
                          []
                        ]
                      },
                      "as": "message",
                      "cond": {
                        "$and": [
                          {
                            "$in": [
                              "$$message.papel",
                              [
                                "human",
                                "assistant"
                              ]
                            ]
                          },
                          {
                            "$eq": [
                              {
                                "$type": "$$message.conteudo"
                              },
                              "string"
                            ]
                          }
                        ]
                      }
                    }
                  },
                  -1
                ]
              }
            }
          }
        ],
        "cursor": {}
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 7.332,
          "resultHash": "40c1bfab487e754caf29351755ee77f2761f9d4abffc187edb541c494022be1d",
          "resultCount": 11,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 11,
            "totalKeysExamined": 11,
            "nReturned": 11,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "sessoes_usuario_atualizacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.175
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 1,
          "medianRoundtripMs": 8.443,
          "resultHash": "40c1bfab487e754caf29351755ee77f2761f9d4abffc187edb541c494022be1d",
          "resultCount": 11,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 11,
            "totalKeysExamined": 11,
            "nReturned": 11,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "sessoes_usuario_atualizacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 8.443
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 1,
          "medianRoundtripMs": 7.359,
          "resultHash": "40c1bfab487e754caf29351755ee77f2761f9d4abffc187edb541c494022be1d",
          "resultCount": 11,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 11,
            "totalKeysExamined": 11,
            "nReturned": 11,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "sessoes_usuario_atualizacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.279
          }
        }
      },
      "resultsEqual": true,
      "title": "IA · listagem de sessões"
    },
    {
      "id": "ia_memoria_resumos",
      "collection": "sessoes",
      "source": "database/sessions.py:MongoSessions.previous",
      "command": {
        "find": "sessoes",
        "filter": {
          "usuario_id": "<SUMMARYUID>",
          "_id": {
            "$ne": "<SESSIONID>"
          },
          "status": {
            "$in": [
              "ativa",
              "encerrada"
            ]
          },
          "resumo": {
            "$type": "string",
            "$ne": ""
          },
          "$or": [
            {
              "status": "encerrada",
              "resumo_mensagens": {
                "$exists": false
              }
            },
            {
              "$expr": {
                "$and": [
                  {
                    "$eq": [
                      "$resumo_mensagens",
                      {
                        "$size": {
                          "$ifNull": [
                            "$mensagens",
                            []
                          ]
                        }
                      }
                    ]
                  },
                  {
                    "$eq": [
                      "$resumo_ultima_mensagem_em",
                      {
                        "$ifNull": [
                          "$ultima_mensagem_em",
                          "$atualizada_em"
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ]
        },
        "sort": {
          "atualizada_em": -1
        },
        "limit": 3,
        "projection": {
          "resumo": 1,
          "iniciada_em": 1,
          "mensagens": {
            "$slice": -6
          }
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 1,
          "p95ServerMs": 3,
          "medianRoundtripMs": 8.474,
          "resultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "resultCount": 0,
          "summary": {
            "executionTimeMillis": 1,
            "totalDocsExamined": 20,
            "totalKeysExamined": 21,
            "nReturned": 0,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_DEFAULT"
            ],
            "indexes": [
              "sessoes_usuario_atualizacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 8.581
          }
        },
        "selected": {
          "medianServerMs": 1,
          "p95ServerMs": 1,
          "medianRoundtripMs": 9.047,
          "resultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "resultCount": 0,
          "summary": {
            "executionTimeMillis": 1,
            "totalDocsExamined": 20,
            "totalKeysExamined": 21,
            "nReturned": 0,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_DEFAULT"
            ],
            "indexes": [
              "sessoes_usuario_atualizacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 9.284
          }
        },
        "selected_repeat": {
          "medianServerMs": 1,
          "p95ServerMs": 2,
          "medianRoundtripMs": 8.496,
          "resultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "resultCount": 0,
          "summary": {
            "executionTimeMillis": 1,
            "totalDocsExamined": 20,
            "totalKeysExamined": 21,
            "nReturned": 0,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_DEFAULT"
            ],
            "indexes": [
              "sessoes_usuario_atualizacao"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 8.557
          }
        }
      },
      "resultsEqual": true,
      "title": "IA · recuperação de resumos"
    },
    {
      "id": "ia_sessao_por_id",
      "collection": "sessoes",
      "source": "database/sessions.py:MongoSessions.get",
      "command": {
        "find": "sessoes",
        "filter": {
          "_id": "<SESSIONID>",
          "usuario_id": "<SESSIONUID>"
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.087,
          "resultHash": "bba454571823f035d902f835948f4c4a03ba7a76d8068884dcec942a98438189",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 1,
            "totalKeysExamined": 1,
            "nReturned": 1,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.603
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.939,
          "resultHash": "bba454571823f035d902f835948f4c4a03ba7a76d8068884dcec942a98438189",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 1,
            "totalKeysExamined": 1,
            "nReturned": 1,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.202
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 7.532,
          "resultHash": "bba454571823f035d902f835948f4c4a03ba7a76d8068884dcec942a98438189",
          "resultCount": 1,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 1,
            "totalKeysExamined": 1,
            "nReturned": 1,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.75
          }
        }
      },
      "resultsEqual": true,
      "title": "IA · sessão por ID"
    },
    {
      "id": "java_nr_catalogo",
      "collection": "nrs",
      "source": "NrReviewRepository.findAll",
      "command": {
        "find": "nrs",
        "filter": {},
        "sort": {
          "_id": 1
        }
      },
      "note": "",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.766,
          "resultHash": "813149cff9d8ed8380dd85c4ebb19ed848fe06679b1a7bcd4a5dd1453c3b1ee7",
          "resultCount": 38,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 38,
            "totalKeysExamined": 38,
            "nReturned": 38,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.429
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 5.792,
          "resultHash": "813149cff9d8ed8380dd85c4ebb19ed848fe06679b1a7bcd4a5dd1453c3b1ee7",
          "resultCount": 38,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 38,
            "totalKeysExamined": 38,
            "nReturned": 38,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.402
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.258,
          "resultHash": "813149cff9d8ed8380dd85c4ebb19ed848fe06679b1a7bcd4a5dd1453c3b1ee7",
          "resultCount": 38,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 38,
            "totalKeysExamined": 38,
            "nReturned": 38,
            "stages": [
              "FETCH",
              "IXSCAN"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.388
          }
        }
      },
      "resultsEqual": true,
      "title": "Java · catálogo de NRs"
    },
    {
      "id": "ia_nrs_candidatas",
      "collection": "nrs",
      "source": "support/nr_recommendations.py:EmployeeNrRepository.list_candidates (MAX_NR_CANDIDATES=50)",
      "command": {
        "find": "nrs",
        "filter": {
          "usabilidade": {
            "$regularExpression": {
              "pattern": "^(?:Colaborador|Funcion[aá]rio)$",
              "options": "iu"
            }
          },
          "revogada": {
            "$ne": true
          }
        },
        "sort": {
          "_id": 1
        },
        "limit": 50,
        "projection": {
          "_id": 1,
          "nome": 1,
          "objetivo": 1,
          "descricao": 1,
          "aplicabilidade": 1
        }
      },
      "note": "Regex case-insensitive e $ne: validar o plano; igualdade simples não reproduz esta consulta.",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.282,
          "resultHash": "0aaf3cc10fe45d218ce0034000dba39767a63855da5b5515d57c9a90cbae8bd1",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 38,
            "totalKeysExamined": 38,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 5.894
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.122,
          "resultHash": "0aaf3cc10fe45d218ce0034000dba39767a63855da5b5515d57c9a90cbae8bd1",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 38,
            "totalKeysExamined": 38,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 6.846
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.615,
          "resultHash": "0aaf3cc10fe45d218ce0034000dba39767a63855da5b5515d57c9a90cbae8bd1",
          "resultCount": 10,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 38,
            "totalKeysExamined": 38,
            "nReturned": 10,
            "stages": [
              "FETCH",
              "IXSCAN",
              "LIMIT",
              "PROJECTION_SIMPLE"
            ],
            "indexes": [
              "_id_"
            ],
            "hasBlockingSort": false,
            "clientRoundtripMs": 7.27
          }
        }
      },
      "resultsEqual": true,
      "title": "IA · NRs candidatas"
    },
    {
      "id": "ia_historico_par_sem_campo",
      "collection": "mensagens",
      "source": "roteador/tools.py:consultar_historico_mensagens",
      "command": {
        "find": "mensagens",
        "filter": {
          "$or": [
            {
              "remetente_id": 2,
              "destinatario_id": 5
            },
            {
              "remetente_id": 5,
              "destinatario_id": 2
            }
          ]
        },
        "sort": {
          "data": -1,
          "_id": -1
        },
        "limit": 5,
        "projection": {
          "_id": 0,
          "remetente_id": 1,
          "destinatario_id": 1,
          "mensagem": 1,
          "data": 1
        }
      },
      "note": "Diagnóstico de contrato: os documentos atuais têm conversa_id, mas não destinatario_id; retorno vazio não comprova desempenho de histórico útil.",
      "phases": {
        "baseline_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.257,
          "resultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "resultCount": 0,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 0,
            "totalKeysExamined": 0,
            "nReturned": 0,
            "stages": [
              "FETCH",
              "IXSCAN",
              "OR",
              "PROJECTION_SIMPLE",
              "SORT",
              "SUBPLAN"
            ],
            "indexes": [
              "mensagens_participantes_data"
            ],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.495
          }
        },
        "selected": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.652,
          "resultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "resultCount": 0,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 0,
            "totalKeysExamined": 0,
            "nReturned": 0,
            "stages": [
              "FETCH",
              "IXSCAN",
              "OR",
              "PROJECTION_SIMPLE",
              "SORT",
              "SUBPLAN"
            ],
            "indexes": [
              "mensagens_participantes_data"
            ],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.054
          }
        },
        "selected_repeat": {
          "medianServerMs": 0,
          "p95ServerMs": 0,
          "medianRoundtripMs": 6.471,
          "resultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "resultCount": 0,
          "summary": {
            "executionTimeMillis": 0,
            "totalDocsExamined": 0,
            "totalKeysExamined": 0,
            "nReturned": 0,
            "stages": [
              "FETCH",
              "IXSCAN",
              "OR",
              "PROJECTION_SIMPLE",
              "SORT",
              "SUBPLAN"
            ],
            "indexes": [
              "mensagens_participantes_data"
            ],
            "hasBlockingSort": true,
            "clientRoundtripMs": 6.337
          }
        }
      },
      "resultsEqual": true,
      "title": "IA · histórico por destinatário (sem dados compatíveis)"
    }
  ]
};

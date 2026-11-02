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
      "title": "Java · mensagens, primeira página",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "conversa_id": {
              "$eq": "<CONVERSATION>"
            }
          },
          "indexFilterSet": false,
          "queryHash": "75D8CF50",
          "planCacheShapeHash": "75D8CF50",
          "planCacheKey": "4DB9C8F0",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "transformBy": {
              "_id": 1,
              "remetente_id": 1,
              "mensagem": 1,
              "resposta_mensagem_id": 1,
              "data": 1
            },
            "inputStage": {
              "stage": "SORT",
              "sortPattern": {
                "data": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "conversa_id": {
                    "$eq": "<CONVERSATION>"
                  }
                },
                "direction": "forward"
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 10,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 111,
          "executionStages": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "nReturned": 10,
            "executionTimeMillisEstimate": 0,
            "works": 123,
            "advanced": 10,
            "needTime": 112,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "transformBy": {
              "_id": 1,
              "remetente_id": 1,
              "mensagem": 1,
              "resposta_mensagem_id": 1,
              "data": 1
            },
            "inputStage": {
              "stage": "SORT",
              "nReturned": 10,
              "executionTimeMillisEstimate": 0,
              "works": 123,
              "advanced": 10,
              "needTime": 112,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "sortPattern": {
                "data": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "totalDataSizeSorted": 3449,
              "usedDisk": false,
              "spills": 0,
              "spilledDataStorageSize": 0,
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "conversa_id": {
                    "$eq": "<CONVERSATION>"
                  }
                },
                "nReturned": 95,
                "executionTimeMillisEstimate": 0,
                "works": 112,
                "advanced": 95,
                "needTime": 16,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "direction": "forward",
                "docsExamined": 111
              }
            }
          }
        },
        "queryShapeHash": "6E304568CF9AA92E3232C78E7DFB64A8EFB399DE8B7E99387134E5B81B380830",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "conversa_id": {
              "$eq": "<CONVERSATION>"
            }
          },
          "indexFilterSet": false,
          "queryHash": "75D8CF50",
          "planCacheShapeHash": "75D8CF50",
          "planCacheKey": "52A7C2BF",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 10,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 1,
                "remetente_id": 1,
                "mensagem": 1,
                "resposta_mensagem_id": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "conversa_id": 1,
                    "data": -1,
                    "_id": -1
                  },
                  "indexName": "idx_mensagens_conversa_data_id",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "conversa_id": [],
                    "data": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "conversa_id": [
                      "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                    ],
                    "data": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, MinKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 10,
          "executionTimeMillis": 0,
          "totalKeysExamined": 10,
          "totalDocsExamined": 10,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 10,
            "executionTimeMillisEstimate": 0,
            "works": 11,
            "advanced": 10,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 10,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 10,
              "executionTimeMillisEstimate": 0,
              "works": 10,
              "advanced": 10,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 0,
              "transformBy": {
                "_id": 1,
                "remetente_id": 1,
                "mensagem": 1,
                "resposta_mensagem_id": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "nReturned": 10,
                "executionTimeMillisEstimate": 0,
                "works": 10,
                "advanced": 10,
                "needTime": 0,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 0,
                "docsExamined": 10,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 10,
                  "executionTimeMillisEstimate": 0,
                  "works": 10,
                  "advanced": 10,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 0,
                  "keyPattern": {
                    "conversa_id": 1,
                    "data": -1,
                    "_id": -1
                  },
                  "indexName": "idx_mensagens_conversa_data_id",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "conversa_id": [],
                    "data": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "conversa_id": [
                      "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                    ],
                    "data": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, MinKey]"
                    ]
                  },
                  "keysExamined": 10,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "6E304568CF9AA92E3232C78E7DFB64A8EFB399DE8B7E99387134E5B81B380830",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · mensagens, página com cursor",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "$and": [
              {
                "$or": [
                  {
                    "$and": [
                      {
                        "data": {
                          "$eq": {
                            "$date": "2026-11-01T19:55:29.622Z"
                          }
                        }
                      },
                      {
                        "_id": {
                          "$lt": "<CURSORID>"
                        }
                      }
                    ]
                  },
                  {
                    "data": {
                      "$lt": {
                        "$date": "2026-11-01T19:55:29.622Z"
                      }
                    }
                  }
                ]
              },
              {
                "conversa_id": {
                  "$eq": "<CONVERSATION>"
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "EC423BA5",
          "planCacheShapeHash": "EC423BA5",
          "planCacheKey": "B53045A5",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "transformBy": {
              "_id": 1,
              "remetente_id": 1,
              "mensagem": 1,
              "resposta_mensagem_id": 1,
              "data": 1
            },
            "inputStage": {
              "stage": "SORT",
              "sortPattern": {
                "data": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "$and": [
                    {
                      "$or": [
                        {
                          "$and": [
                            {
                              "data": {
                                "$eq": {
                                  "$date": "2026-11-01T19:55:29.622Z"
                                }
                              }
                            },
                            {
                              "_id": {
                                "$lt": "<CURSORID>"
                              }
                            }
                          ]
                        },
                        {
                          "data": {
                            "$lt": {
                              "$date": "2026-11-01T19:55:29.622Z"
                            }
                          }
                        }
                      ]
                    },
                    {
                      "conversa_id": {
                        "$eq": "<CONVERSATION>"
                      }
                    }
                  ]
                },
                "direction": "forward"
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 10,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 111,
          "executionStages": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "nReturned": 10,
            "executionTimeMillisEstimate": 0,
            "works": 123,
            "advanced": 10,
            "needTime": 112,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "transformBy": {
              "_id": 1,
              "remetente_id": 1,
              "mensagem": 1,
              "resposta_mensagem_id": 1,
              "data": 1
            },
            "inputStage": {
              "stage": "SORT",
              "nReturned": 10,
              "executionTimeMillisEstimate": 0,
              "works": 123,
              "advanced": 10,
              "needTime": 112,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "sortPattern": {
                "data": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "totalDataSizeSorted": 3458,
              "usedDisk": false,
              "spills": 0,
              "spilledDataStorageSize": 0,
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "$and": [
                    {
                      "$or": [
                        {
                          "$and": [
                            {
                              "data": {
                                "$eq": {
                                  "$date": "2026-11-01T19:55:29.622Z"
                                }
                              }
                            },
                            {
                              "_id": {
                                "$lt": "<CURSORID>"
                              }
                            }
                          ]
                        },
                        {
                          "data": {
                            "$lt": {
                              "$date": "2026-11-01T19:55:29.622Z"
                            }
                          }
                        }
                      ]
                    },
                    {
                      "conversa_id": {
                        "$eq": "<CONVERSATION>"
                      }
                    }
                  ]
                },
                "nReturned": 84,
                "executionTimeMillisEstimate": 0,
                "works": 112,
                "advanced": 84,
                "needTime": 27,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "direction": "forward",
                "docsExamined": 111
              }
            }
          }
        },
        "queryShapeHash": "E5BD61459CCD4DF8C6C967380932C678EBD39764B933280683201E660020B838",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "$and": [
              {
                "$or": [
                  {
                    "$and": [
                      {
                        "data": {
                          "$eq": {
                            "$date": "2026-11-01T19:55:29.622Z"
                          }
                        }
                      },
                      {
                        "_id": {
                          "$lt": "<CURSORID>"
                        }
                      }
                    ]
                  },
                  {
                    "data": {
                      "$lt": {
                        "$date": "2026-11-01T19:55:29.622Z"
                      }
                    }
                  }
                ]
              },
              {
                "conversa_id": {
                  "$eq": "<CONVERSATION>"
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "EC423BA5",
          "planCacheShapeHash": "EC423BA5",
          "planCacheKey": "5EA2CF12",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": true,
            "stage": "LIMIT",
            "limitAmount": 10,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 1,
                "remetente_id": 1,
                "mensagem": 1,
                "resposta_mensagem_id": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "inputStage": {
                  "stage": "SORT_MERGE",
                  "sortPattern": {
                    "data": -1,
                    "_id": -1
                  },
                  "inputStages": [
                    {
                      "stage": "IXSCAN",
                      "keyPattern": {
                        "conversa_id": 1,
                        "data": -1,
                        "_id": -1
                      },
                      "indexName": "idx_mensagens_conversa_data_id",
                      "isMultiKey": false,
                      "multiKeyPaths": {
                        "conversa_id": [],
                        "data": [],
                        "_id": []
                      },
                      "isUnique": false,
                      "isSparse": false,
                      "isPartial": false,
                      "indexVersion": 2,
                      "direction": "forward",
                      "indexBounds": {
                        "conversa_id": [
                          "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                        ],
                        "data": [
                          "(new Date(1793562929622), new Date(-9223372036854775808)]"
                        ],
                        "_id": [
                          "[MaxKey, MinKey]"
                        ]
                      }
                    },
                    {
                      "stage": "IXSCAN",
                      "keyPattern": {
                        "conversa_id": 1,
                        "data": -1,
                        "_id": -1
                      },
                      "indexName": "idx_mensagens_conversa_data_id",
                      "isMultiKey": false,
                      "multiKeyPaths": {
                        "conversa_id": [],
                        "data": [],
                        "_id": []
                      },
                      "isUnique": false,
                      "isSparse": false,
                      "isPartial": false,
                      "indexVersion": 2,
                      "direction": "forward",
                      "indexBounds": {
                        "conversa_id": [
                          "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                        ],
                        "data": [
                          "[new Date(1793562929622), new Date(1793562929622)]"
                        ],
                        "_id": [
                          "(\"<CURSORID>\", \"\"]"
                        ]
                      }
                    }
                  ]
                }
              }
            }
          },
          "rejectedPlans": [
            {
              "isCached": false,
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 1,
                "remetente_id": 1,
                "mensagem": 1,
                "resposta_mensagem_id": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "data": -1,
                  "_id": -1
                },
                "memLimit": 33554432,
                "limitAmount": 10,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "conversa_id": {
                      "$eq": "<CONVERSATION>"
                    }
                  },
                  "inputStage": {
                    "stage": "OR",
                    "inputStages": [
                      {
                        "stage": "FETCH",
                        "filter": {
                          "data": {
                            "$eq": {
                              "$date": "2026-11-01T19:55:29.622Z"
                            }
                          }
                        },
                        "inputStage": {
                          "stage": "IXSCAN",
                          "keyPattern": {
                            "_id": 1
                          },
                          "indexName": "_id_",
                          "isMultiKey": false,
                          "isUnique": true,
                          "isSparse": false,
                          "isPartial": false,
                          "indexVersion": 2,
                          "direction": "forward",
                          "indexBounds": {
                            "_id": [
                              "[\"\", \"<CURSORID>\")"
                            ]
                          }
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "conversa_id": 1,
                          "data": -1,
                          "_id": -1
                        },
                        "indexName": "idx_mensagens_conversa_data_id",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "conversa_id": [],
                          "data": [],
                          "_id": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "conversa_id": [
                            "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                          ],
                          "data": [
                            "(new Date(1793562929622), new Date(-9223372036854775808)]"
                          ],
                          "_id": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "LIMIT",
              "limitAmount": 10,
              "inputStage": {
                "stage": "PROJECTION_SIMPLE",
                "transformBy": {
                  "_id": 1,
                  "remetente_id": 1,
                  "mensagem": 1,
                  "resposta_mensagem_id": 1,
                  "data": 1
                },
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$or": [
                      {
                        "$and": [
                          {
                            "_id": {
                              "$lt": "<CURSORID>"
                            }
                          },
                          {
                            "data": {
                              "$eq": {
                                "$date": "2026-11-01T19:55:29.622Z"
                              }
                            }
                          }
                        ]
                      },
                      {
                        "data": {
                          "$lt": {
                            "$date": "2026-11-01T19:55:29.622Z"
                          }
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "IXSCAN",
                    "keyPattern": {
                      "conversa_id": 1,
                      "data": -1,
                      "_id": -1
                    },
                    "indexName": "idx_mensagens_conversa_data_id",
                    "isMultiKey": false,
                    "multiKeyPaths": {
                      "conversa_id": [],
                      "data": [],
                      "_id": []
                    },
                    "isUnique": false,
                    "isSparse": false,
                    "isPartial": false,
                    "indexVersion": 2,
                    "direction": "forward",
                    "indexBounds": {
                      "conversa_id": [
                        "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                      ],
                      "data": [
                        "[MaxKey, MinKey]"
                      ],
                      "_id": [
                        "[MaxKey, MinKey]"
                      ]
                    }
                  }
                }
              }
            }
          ]
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 10,
          "executionTimeMillis": 0,
          "totalKeysExamined": 10,
          "totalDocsExamined": 10,
          "executionStages": {
            "isCached": true,
            "stage": "LIMIT",
            "nReturned": 10,
            "executionTimeMillisEstimate": 0,
            "works": 22,
            "advanced": 10,
            "needTime": 11,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 10,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 10,
              "executionTimeMillisEstimate": 0,
              "works": 21,
              "advanced": 10,
              "needTime": 11,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 0,
              "transformBy": {
                "_id": 1,
                "remetente_id": 1,
                "mensagem": 1,
                "resposta_mensagem_id": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "nReturned": 10,
                "executionTimeMillisEstimate": 0,
                "works": 21,
                "advanced": 10,
                "needTime": 11,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 0,
                "docsExamined": 10,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "SORT_MERGE",
                  "nReturned": 10,
                  "executionTimeMillisEstimate": 0,
                  "works": 21,
                  "advanced": 10,
                  "needTime": 11,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 0,
                  "sortPattern": {
                    "data": -1,
                    "_id": -1
                  },
                  "dupsTested": 10,
                  "dupsDropped": 0,
                  "inputStages": [
                    {
                      "stage": "IXSCAN",
                      "nReturned": 10,
                      "executionTimeMillisEstimate": 0,
                      "works": 10,
                      "advanced": 10,
                      "needTime": 0,
                      "needYield": 0,
                      "saveState": 0,
                      "restoreState": 0,
                      "isEOF": 0,
                      "keyPattern": {
                        "conversa_id": 1,
                        "data": -1,
                        "_id": -1
                      },
                      "indexName": "idx_mensagens_conversa_data_id",
                      "isMultiKey": false,
                      "multiKeyPaths": {
                        "conversa_id": [],
                        "data": [],
                        "_id": []
                      },
                      "isUnique": false,
                      "isSparse": false,
                      "isPartial": false,
                      "indexVersion": 2,
                      "direction": "forward",
                      "indexBounds": {
                        "conversa_id": [
                          "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                        ],
                        "data": [
                          "(new Date(1793562929622), new Date(-9223372036854775808)]"
                        ],
                        "_id": [
                          "[MaxKey, MinKey]"
                        ]
                      },
                      "keysExamined": 10,
                      "seeks": 1,
                      "dupsTested": 0,
                      "dupsDropped": 0
                    },
                    {
                      "stage": "IXSCAN",
                      "nReturned": 0,
                      "executionTimeMillisEstimate": 0,
                      "works": 1,
                      "advanced": 0,
                      "needTime": 0,
                      "needYield": 0,
                      "saveState": 0,
                      "restoreState": 0,
                      "isEOF": 1,
                      "keyPattern": {
                        "conversa_id": 1,
                        "data": -1,
                        "_id": -1
                      },
                      "indexName": "idx_mensagens_conversa_data_id",
                      "isMultiKey": false,
                      "multiKeyPaths": {
                        "conversa_id": [],
                        "data": [],
                        "_id": []
                      },
                      "isUnique": false,
                      "isSparse": false,
                      "isPartial": false,
                      "indexVersion": 2,
                      "direction": "forward",
                      "indexBounds": {
                        "conversa_id": [
                          "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                        ],
                        "data": [
                          "[new Date(1793562929622), new Date(1793562929622)]"
                        ],
                        "_id": [
                          "(\"<CURSORID>\", \"\"]"
                        ]
                      },
                      "keysExamined": 0,
                      "seeks": 1,
                      "dupsTested": 0,
                      "dupsDropped": 0
                    }
                  ]
                }
              }
            }
          }
        },
        "queryShapeHash": "E5BD61459CCD4DF8C6C967380932C678EBD39764B933280683201E660020B838",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · mensagem por ID",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "$and": [
              {
                "_id": {
                  "$eq": "<IDENTIFIER_1>"
                }
              },
              {
                "conversa_id": {
                  "$eq": "<CONVERSATION>"
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "D1A64674",
          "planCacheShapeHash": "D1A64674",
          "planCacheKey": "FD0FFCD8",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "conversa_id": {
                "$eq": "<CONVERSATION>"
              }
            },
            "inputStage": {
              "stage": "IXSCAN",
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<IDENTIFIER_1>\", \"<IDENTIFIER_1>\"]"
                ]
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 1,
          "executionTimeMillis": 0,
          "totalKeysExamined": 1,
          "totalDocsExamined": 1,
          "executionStages": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "conversa_id": {
                "$eq": "<CONVERSATION>"
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0,
            "works": 2,
            "advanced": 1,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "docsExamined": 1,
            "alreadyHasObj": 0,
            "inputStage": {
              "stage": "IXSCAN",
              "nReturned": 1,
              "executionTimeMillisEstimate": 0,
              "works": 2,
              "advanced": 1,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<IDENTIFIER_1>\", \"<IDENTIFIER_1>\"]"
                ]
              },
              "keysExamined": 1,
              "seeks": 1,
              "dupsTested": 0,
              "dupsDropped": 0
            }
          }
        },
        "queryShapeHash": "A58815143DD641164F2937B76734258E829664AD2C7E1611799FCCDAE7837A49",
        "command": {
          "find": "mensagens",
          "filter": {
            "_id": "<IDENTIFIER_1>",
            "conversa_id": "<CONVERSATION>"
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "$and": [
              {
                "_id": {
                  "$eq": "<IDENTIFIER_1>"
                }
              },
              {
                "conversa_id": {
                  "$eq": "<CONVERSATION>"
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "D1A64674",
          "planCacheShapeHash": "D1A64674",
          "planCacheKey": "00FEC005",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "conversa_id": {
                "$eq": "<CONVERSATION>"
              }
            },
            "inputStage": {
              "stage": "IXSCAN",
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<IDENTIFIER_1>\", \"<IDENTIFIER_1>\"]"
                ]
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 1,
          "executionTimeMillis": 0,
          "totalKeysExamined": 1,
          "totalDocsExamined": 1,
          "executionStages": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "conversa_id": {
                "$eq": "<CONVERSATION>"
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0,
            "works": 2,
            "advanced": 1,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "docsExamined": 1,
            "alreadyHasObj": 0,
            "inputStage": {
              "stage": "IXSCAN",
              "nReturned": 1,
              "executionTimeMillisEstimate": 0,
              "works": 2,
              "advanced": 1,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<IDENTIFIER_1>\", \"<IDENTIFIER_1>\"]"
                ]
              },
              "keysExamined": 1,
              "seeks": 1,
              "dupsTested": 0,
              "dupsDropped": 0
            }
          }
        },
        "queryShapeHash": "A58815143DD641164F2937B76734258E829664AD2C7E1611799FCCDAE7837A49",
        "command": {
          "find": "mensagens",
          "filter": {
            "_id": "<IDENTIFIER_1>",
            "conversa_id": "<CONVERSATION>"
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · última mensagem por conversa",
      "beforePlan": {
        "explainVersion": "2",
        "stages": [
          {
            "$cursor": {
              "queryPlanner": {
                "namespace": "astro.mensagens",
                "parsedQuery": {
                  "conversa_id": {
                    "$in": [
                      "<CONVERSATION>",
                      "<IDENTIFIER_2>"
                    ]
                  }
                },
                "indexFilterSet": false,
                "queryHash": "CA6C8AEC",
                "planCacheShapeHash": "CA6C8AEC",
                "planCacheKey": "2ADABAC4",
                "optimizationTimeMillis": 0,
                "maxIndexedOrSolutionsReached": false,
                "maxIndexedAndSolutionsReached": false,
                "maxScansToExplodeReached": false,
                "prunedSimilarIndexes": false,
                "winningPlan": {
                  "isCached": false,
                  "queryPlan": {
                    "stage": "GROUP",
                    "planNodeId": 4,
                    "inputStage": {
                      "stage": "SORT",
                      "planNodeId": 2,
                      "sortPattern": {
                        "data": -1,
                        "_id": -1
                      },
                      "memLimit": 33554432,
                      "type": "simple",
                      "inputStage": {
                        "stage": "COLLSCAN",
                        "planNodeId": 1,
                        "filter": {
                          "conversa_id": {
                            "$in": [
                              "<CONVERSATION>",
                              "<IDENTIFIER_2>"
                            ]
                          }
                        },
                        "direction": "forward"
                      }
                    }
                  },
                  "slotBasedPlan": {
                    "slots": "$$RESULT=s19 env: { s8 = InList(\"<CONVERSATION>\" \"<IDENTIFIER_2>\") }",
                    "stages": "[4] project [s19 = newObj(\"_id\", s15, \"senderId\", s16, \"content\", s17, \"date\", s18)] \n[4] group [s15] [s16 = first((s5 ?: null)), s17 = first((s4 ?: null)), s18 = first((s3 ?: null))] spillSlots[s12, s13, s14] mergingExprs[first((s12 ?: null)), first((s13 ?: null)), first((s14 ?: null))] \n[4] project [s15 = (s2 ?: null)] \n[2] sort [s10, s11] [desc, desc] [s2, s3, s4, s5] \n[2] project [s9 = ((!((isArray(s3) ?: false)) || !((isArray(s1) ?: false))) || fail(2, \"cannot sort with keys that are parallel arrays\")), s10 = getSortKeyDesc(s3), s11 = getSortKeyDesc(s1)] \n[1] filter {traverseF(s2, lambda(l2.0) { isMember(move(l2.0), s8) }, false)} \n[1] scan s6 s7 none none none none none none lowPriority [s1 = _id, s2 = conversa_id, s3 = data, s4 = mensagem, s5 = remetente_id] @\"<IDENTIFIER_3>\" true false "
                  }
                },
                "rejectedPlans": []
              },
              "executionStats": {
                "executionSuccess": true,
                "nReturned": 2,
                "executionTimeMillis": 0,
                "totalKeysExamined": 0,
                "totalDocsExamined": 111,
                "executionStages": {
                  "stage": "project",
                  "planNodeId": 4,
                  "nReturned": 2,
                  "executionTimeMillisEstimate": 0,
                  "opens": 1,
                  "closes": 1,
                  "saveState": 1,
                  "restoreState": 1,
                  "isEOF": 1,
                  "projections": {
                    "19": "newObj(\"_id\", s15, \"senderId\", s16, \"content\", s17, \"date\", s18) "
                  },
                  "inputStage": {
                    "stage": "group",
                    "planNodeId": 4,
                    "nReturned": 2,
                    "executionTimeMillisEstimate": 0,
                    "opens": 1,
                    "closes": 1,
                    "saveState": 1,
                    "restoreState": 1,
                    "isEOF": 1,
                    "groupBySlots": [
                      15
                    ],
                    "expressions": {
                      "16": "first((s5 ?: null)) ",
                      "17": "first((s4 ?: null)) ",
                      "18": "first((s3 ?: null)) ",
                      "initExprs": {
                        "16": null,
                        "17": null,
                        "18": null
                      }
                    },
                    "mergingExprs": {
                      "12": "first((s12 ?: null)) ",
                      "13": "first((s13 ?: null)) ",
                      "14": "first((s14 ?: null)) "
                    },
                    "usedDisk": false,
                    "spills": 0,
                    "spilledBytes": 0,
                    "spilledRecords": 0,
                    "spilledDataStorageSize": 0,
                    "inputStage": {
                      "stage": "project",
                      "planNodeId": 4,
                      "nReturned": 107,
                      "executionTimeMillisEstimate": 0,
                      "opens": 1,
                      "closes": 1,
                      "saveState": 1,
                      "restoreState": 1,
                      "isEOF": 1,
                      "projections": {
                        "15": "(s2 ?: null) "
                      },
                      "inputStage": {
                        "stage": "sort",
                        "planNodeId": 2,
                        "nReturned": 107,
                        "executionTimeMillisEstimate": 0,
                        "opens": 1,
                        "closes": 1,
                        "saveState": 1,
                        "restoreState": 1,
                        "isEOF": 1,
                        "memLimit": 33554432,
                        "totalDataSizeSorted": 0,
                        "usedDisk": false,
                        "spills": 0,
                        "spilledDataStorageSize": 0,
                        "orderBySlots": {
                          "10": "desc",
                          "11": "desc"
                        },
                        "outputSlots": [
                          2,
                          3,
                          4,
                          5
                        ],
                        "inputStage": {
                          "stage": "project",
                          "planNodeId": 2,
                          "nReturned": 107,
                          "executionTimeMillisEstimate": 0,
                          "opens": 1,
                          "closes": 1,
                          "saveState": 1,
                          "restoreState": 1,
                          "isEOF": 1,
                          "projections": {
                            "9": "((!((isArray(s3) ?: false)) || !((isArray(s1) ?: false))) || fail(2, \"cannot sort with keys that are parallel arrays\")) ",
                            "10": "getSortKeyDesc(s3) ",
                            "11": "getSortKeyDesc(s1) "
                          },
                          "inputStage": {
                            "stage": "filter",
                            "planNodeId": 1,
                            "nReturned": 107,
                            "executionTimeMillisEstimate": 0,
                            "opens": 1,
                            "closes": 1,
                            "saveState": 1,
                            "restoreState": 1,
                            "isEOF": 1,
                            "numTested": 111,
                            "filter": "traverseF(s2, lambda(l2.0) { isMember(move(l2.0), s8) }, false) ",
                            "inputStage": {
                              "stage": "scan",
                              "planNodeId": 1,
                              "nReturned": 111,
                              "executionTimeMillisEstimate": 0,
                              "opens": 1,
                              "closes": 1,
                              "saveState": 1,
                              "restoreState": 1,
                              "isEOF": 1,
                              "numReads": 111,
                              "recordSlot": 6,
                              "recordIdSlot": 7,
                              "scanFieldNames": [
                                "_id",
                                "conversa_id",
                                "data",
                                "mensagem",
                                "remetente_id"
                              ],
                              "scanFieldSlots": [
                                1,
                                2,
                                3,
                                4,
                                5
                              ]
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "nReturned": 2,
            "executionTimeMillisEstimate": 0
          },
          {
            "$project": {
              "_id": true,
              "senderId": true,
              "content": true,
              "date": true,
              "conversationId": "$_id"
            },
            "nReturned": 2,
            "executionTimeMillisEstimate": 0
          }
        ],
        "queryShapeHash": "8E0A7F7884BFC015F1F8A3EFA54E209D96407FC9FA4B431329AB7522B4832B48",
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
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
          "cursor": {},
          "$db": "astro"
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "2",
        "stages": [
          {
            "$cursor": {
              "queryPlanner": {
                "namespace": "astro.mensagens",
                "parsedQuery": {
                  "conversa_id": {
                    "$in": [
                      "<CONVERSATION>",
                      "<IDENTIFIER_2>"
                    ]
                  }
                },
                "indexFilterSet": false,
                "queryHash": "CA6C8AEC",
                "planCacheShapeHash": "CA6C8AEC",
                "planCacheKey": "E1C6C6B0",
                "optimizationTimeMillis": 0,
                "maxIndexedOrSolutionsReached": false,
                "maxIndexedAndSolutionsReached": false,
                "maxScansToExplodeReached": false,
                "prunedSimilarIndexes": false,
                "winningPlan": {
                  "isCached": false,
                  "queryPlan": {
                    "stage": "GROUP",
                    "planNodeId": 6,
                    "inputStage": {
                      "stage": "FETCH",
                      "planNodeId": 4,
                      "inputStage": {
                        "stage": "SORT_MERGE",
                        "planNodeId": 3,
                        "sortPattern": {
                          "data": -1,
                          "_id": -1
                        },
                        "inputStages": [
                          {
                            "stage": "IXSCAN",
                            "planNodeId": 1,
                            "keyPattern": {
                              "conversa_id": 1,
                              "data": -1,
                              "_id": -1
                            },
                            "indexName": "idx_mensagens_conversa_data_id",
                            "isMultiKey": false,
                            "multiKeyPaths": {
                              "conversa_id": [],
                              "data": [],
                              "_id": []
                            },
                            "isUnique": false,
                            "isSparse": false,
                            "isPartial": false,
                            "indexVersion": 2,
                            "direction": "forward",
                            "indexBounds": {
                              "conversa_id": [
                                "[\"<CONVERSATION>\", \"<CONVERSATION>\"]"
                              ],
                              "data": [
                                "[MaxKey, MinKey]"
                              ],
                              "_id": [
                                "[MaxKey, MinKey]"
                              ]
                            }
                          },
                          {
                            "stage": "IXSCAN",
                            "planNodeId": 2,
                            "keyPattern": {
                              "conversa_id": 1,
                              "data": -1,
                              "_id": -1
                            },
                            "indexName": "idx_mensagens_conversa_data_id",
                            "isMultiKey": false,
                            "multiKeyPaths": {
                              "conversa_id": [],
                              "data": [],
                              "_id": []
                            },
                            "isUnique": false,
                            "isSparse": false,
                            "isPartial": false,
                            "indexVersion": 2,
                            "direction": "forward",
                            "indexBounds": {
                              "conversa_id": [
                                "[\"<IDENTIFIER_2>\", \"<IDENTIFIER_2>\"]"
                              ],
                              "data": [
                                "[MaxKey, MinKey]"
                              ],
                              "_id": [
                                "[MaxKey, MinKey]"
                              ]
                            }
                          }
                        ]
                      }
                    }
                  },
                  "slotBasedPlan": {
                    "slots": "$$RESULT=s34 env: { s7 = {\"conversa_id\" : 1, \"data\" : -1, \"_id\" : -1} }",
                    "stages": "[6] project [s34 = newObj(\"_id\", s30, \"senderId\", s31, \"content\", s32, \"date\", s33)] \n[6] group [s30] [s31 = first((s26 ?: null)), s32 = first((s25 ?: null)), s33 = first((s24 ?: null))] spillSlots[s27, s28, s29] mergingExprs[first((s27 ?: null)), first((s28 ?: null)), first((s29 ?: null))] \n[6] project [s30 = (s23 ?: null)] \n[4] nlj inner [] [s17, s18, s14, s15, s16] \n    left \n        [3] smerge [s14, s15, s16, s17, s18, s19, s20] [desc, desc] [\n            [s1, s2] [s5, s6, s7, s3, s4, s2, s1] [1] ixseek KS(3C30376233353461662D373666652D336263632D613663362D383561353834636362636639000F0F0104) KS(3C30376233353461662D373666652D336263632D613663362D38356135383463636263663900F5F5FE04) s6 s3 s4 s5 [s1 = 1, s2 = 2] @\"<IDENTIFIER_3>\" @\"idx_mensagens_conversa_data_id\" true , \n            [s8, s9] [s12, s13, s7, s10, s11, s9, s8] [2] ixseek KS(3C37353261393533392D373231642D333039312D623963632D333963633230636161313935000F0F0104) KS(3C37353261393533392D373231642D333039312D623963632D33396363323063616131393500F5F5FE04) s13 s10 s11 s12 [s8 = 1, s9 = 2] @\"<IDENTIFIER_3>\" @\"idx_mensagens_conversa_data_id\" true \n       ] \n    right \n        [4] limit 1ll \n        [4] seek s17 s21 s22 s18 s14 s15 s16 none none [s23 = conversa_id, s24 = data, s25 = mensagem, s26 = remetente_id] @\"<IDENTIFIER_3>\" true false \n"
                  }
                },
                "rejectedPlans": []
              },
              "executionStats": {
                "executionSuccess": true,
                "nReturned": 2,
                "executionTimeMillis": 0,
                "totalKeysExamined": 107,
                "totalDocsExamined": 107,
                "executionStages": {
                  "stage": "project",
                  "planNodeId": 6,
                  "nReturned": 2,
                  "executionTimeMillisEstimate": 0,
                  "opens": 1,
                  "closes": 1,
                  "saveState": 1,
                  "restoreState": 1,
                  "isEOF": 1,
                  "projections": {
                    "34": "newObj(\"_id\", s30, \"senderId\", s31, \"content\", s32, \"date\", s33) "
                  },
                  "inputStage": {
                    "stage": "group",
                    "planNodeId": 6,
                    "nReturned": 2,
                    "executionTimeMillisEstimate": 0,
                    "opens": 1,
                    "closes": 1,
                    "saveState": 1,
                    "restoreState": 1,
                    "isEOF": 1,
                    "groupBySlots": [
                      30
                    ],
                    "expressions": {
                      "31": "first((s26 ?: null)) ",
                      "32": "first((s25 ?: null)) ",
                      "33": "first((s24 ?: null)) ",
                      "initExprs": {
                        "31": null,
                        "32": null,
                        "33": null
                      }
                    },
                    "mergingExprs": {
                      "27": "first((s27 ?: null)) ",
                      "28": "first((s28 ?: null)) ",
                      "29": "first((s29 ?: null)) "
                    },
                    "usedDisk": false,
                    "spills": 0,
                    "spilledBytes": 0,
                    "spilledRecords": 0,
                    "spilledDataStorageSize": 0,
                    "inputStage": {
                      "stage": "project",
                      "planNodeId": 6,
                      "nReturned": 107,
                      "executionTimeMillisEstimate": 0,
                      "opens": 1,
                      "closes": 1,
                      "saveState": 1,
                      "restoreState": 1,
                      "isEOF": 1,
                      "projections": {
                        "30": "(s23 ?: null) "
                      },
                      "inputStage": {
                        "stage": "nlj",
                        "planNodeId": 4,
                        "nReturned": 107,
                        "executionTimeMillisEstimate": 0,
                        "opens": 1,
                        "closes": 1,
                        "saveState": 1,
                        "restoreState": 1,
                        "isEOF": 1,
                        "totalDocsExamined": 107,
                        "totalKeysExamined": 107,
                        "collectionScans": 0,
                        "collectionSeeks": 107,
                        "indexScans": 0,
                        "indexSeeks": 2,
                        "indexesUsed": [
                          "idx_mensagens_conversa_data_id",
                          "idx_mensagens_conversa_data_id"
                        ],
                        "innerOpens": 107,
                        "innerCloses": 1,
                        "outerProjects": [],
                        "outerCorrelated": [
                          17,
                          18,
                          14,
                          15,
                          16
                        ],
                        "outerStage": {
                          "stage": "smerge",
                          "planNodeId": 3,
                          "nReturned": 107,
                          "executionTimeMillisEstimate": 0,
                          "opens": 1,
                          "closes": 1,
                          "saveState": 1,
                          "restoreState": 1,
                          "isEOF": 1,
                          "inputKeySlots": [
                            {
                              "1": "desc",
                              "2": "desc"
                            },
                            {
                              "8": "desc",
                              "9": "desc"
                            }
                          ],
                          "inputValSlots": [
                            5,
                            6,
                            7,
                            3,
                            4,
                            2,
                            1,
                            12,
                            13,
                            7,
                            10,
                            11,
                            9,
                            8
                          ],
                          "outputSlots": [
                            14,
                            15,
                            16,
                            17,
                            18,
                            19,
                            20
                          ],
                          "inputStages": [
                            {
                              "stage": "ixseek",
                              "planNodeId": 1,
                              "nReturned": 95,
                              "executionTimeMillisEstimate": 0,
                              "opens": 1,
                              "closes": 1,
                              "saveState": 1,
                              "restoreState": 1,
                              "isEOF": 1,
                              "indexName": "idx_mensagens_conversa_data_id",
                              "keysExamined": 95,
                              "seeks": 1,
                              "numReads": 96,
                              "indexKeySlot": 6,
                              "recordIdSlot": 3,
                              "snapshotIdSlot": 4,
                              "indexIdentSlot": 5,
                              "outputSlots": [
                                1,
                                2
                              ],
                              "indexKeysToInclude": "00000000000000000000000000000110",
                              "seekKeyLow": "KS(3C30376233353461662D373666652D336263632D613663362D383561353834636362636639000F0F0104) ",
                              "seekKeyHigh": "KS(3C30376233353461662D373666652D336263632D613663362D38356135383463636263663900F5F5FE04) "
                            },
                            {
                              "stage": "ixseek",
                              "planNodeId": 2,
                              "nReturned": 12,
                              "executionTimeMillisEstimate": 0,
                              "opens": 1,
                              "closes": 1,
                              "saveState": 1,
                              "restoreState": 1,
                              "isEOF": 1,
                              "indexName": "idx_mensagens_conversa_data_id",
                              "keysExamined": 12,
                              "seeks": 1,
                              "numReads": 13,
                              "indexKeySlot": 13,
                              "recordIdSlot": 10,
                              "snapshotIdSlot": 11,
                              "indexIdentSlot": 12,
                              "outputSlots": [
                                8,
                                9
                              ],
                              "indexKeysToInclude": "00000000000000000000000000000110",
                              "seekKeyLow": "KS(3C37353261393533392D373231642D333039312D623963632D333963633230636161313935000F0F0104) ",
                              "seekKeyHigh": "KS(3C37353261393533392D373231642D333039312D623963632D33396363323063616131393500F5F5FE04) "
                            }
                          ]
                        },
                        "innerStage": {
                          "stage": "limit",
                          "planNodeId": 4,
                          "nReturned": 107,
                          "executionTimeMillisEstimate": 0,
                          "opens": 107,
                          "closes": 1,
                          "saveState": 1,
                          "restoreState": 1,
                          "isEOF": 1,
                          "limit": 1,
                          "inputStage": {
                            "stage": "seek",
                            "planNodeId": 4,
                            "nReturned": 107,
                            "executionTimeMillisEstimate": 0,
                            "opens": 107,
                            "closes": 1,
                            "saveState": 1,
                            "restoreState": 1,
                            "isEOF": 0,
                            "numReads": 107,
                            "recordSlot": 21,
                            "recordIdSlot": 22,
                            "seekRecordIdSlot": 17,
                            "snapshotIdSlot": 18,
                            "indexIdentSlot": 14,
                            "indexKeySlot": 15,
                            "indexKeyPatternSlot": 16,
                            "scanFieldNames": [
                              "conversa_id",
                              "data",
                              "mensagem",
                              "remetente_id"
                            ],
                            "scanFieldSlots": [
                              23,
                              24,
                              25,
                              26
                            ]
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "nReturned": 2,
            "executionTimeMillisEstimate": 0
          },
          {
            "$project": {
              "_id": true,
              "senderId": true,
              "content": true,
              "date": true,
              "conversationId": "$_id"
            },
            "nReturned": 2,
            "executionTimeMillisEstimate": 0
          }
        ],
        "queryShapeHash": "8E0A7F7884BFC015F1F8A3EFA54E209D96407FC9FA4B431329AB7522B4832B48",
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
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
          "cursor": {},
          "$db": "astro"
        },
        "ok": 1.0
      }
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
      "title": "Java · conversas por participante",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.conversas",
          "parsedQuery": {
            "$and": [
              {
                "participantes_ids": {
                  "$size": 2
                }
              },
              {
                "participantes_ids": {
                  "$eq": 2
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "E368CC43",
          "planCacheShapeHash": "E368CC43",
          "planCacheKey": "DD5DAB5F",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "transformBy": {
              "_id": 1,
              "participantes_ids": 1
            },
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  }
                ]
              },
              "direction": "forward"
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 2,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 4,
          "executionStages": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "nReturned": 2,
            "executionTimeMillisEstimate": 0,
            "works": 5,
            "advanced": 2,
            "needTime": 2,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "transformBy": {
              "_id": 1,
              "participantes_ids": 1
            },
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  }
                ]
              },
              "nReturned": 2,
              "executionTimeMillisEstimate": 0,
              "works": 5,
              "advanced": 2,
              "needTime": 2,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "direction": "forward",
              "docsExamined": 4
            }
          }
        },
        "queryShapeHash": "F48F7BCDF1B2B04C48F985342D8BB000244F74ACB3772B5FC1C61B444203A62D",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.conversas",
          "parsedQuery": {
            "$and": [
              {
                "participantes_ids": {
                  "$size": 2
                }
              },
              {
                "participantes_ids": {
                  "$eq": 2
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "E368CC43",
          "planCacheShapeHash": "E368CC43",
          "planCacheKey": "DD5DAB5F",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "transformBy": {
              "_id": 1,
              "participantes_ids": 1
            },
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  }
                ]
              },
              "direction": "forward"
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 2,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 4,
          "executionStages": {
            "isCached": false,
            "stage": "PROJECTION_SIMPLE",
            "nReturned": 2,
            "executionTimeMillisEstimate": 0,
            "works": 5,
            "advanced": 2,
            "needTime": 2,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "transformBy": {
              "_id": 1,
              "participantes_ids": 1
            },
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  }
                ]
              },
              "nReturned": 2,
              "executionTimeMillisEstimate": 0,
              "works": 5,
              "advanced": 2,
              "needTime": 2,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "direction": "forward",
              "docsExamined": 4
            }
          }
        },
        "queryShapeHash": "F48F7BCDF1B2B04C48F985342D8BB000244F74ACB3772B5FC1C61B444203A62D",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · conversa pelo par",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.conversas",
          "parsedQuery": {
            "$and": [
              {
                "participantes_ids": {
                  "$size": 2
                }
              },
              {
                "participantes_ids": {
                  "$eq": 2
                }
              },
              {
                "participantes_ids": {
                  "$eq": 5
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "539B463A",
          "planCacheShapeHash": "539B463A",
          "planCacheKey": "E66289D2",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 2,
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 5
                    }
                  }
                ]
              },
              "direction": "forward"
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 1,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 4,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 1,
            "executionTimeMillisEstimate": 0,
            "works": 5,
            "advanced": 1,
            "needTime": 3,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 2,
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 5
                    }
                  }
                ]
              },
              "nReturned": 1,
              "executionTimeMillisEstimate": 0,
              "works": 5,
              "advanced": 1,
              "needTime": 3,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "direction": "forward",
              "docsExamined": 4
            }
          }
        },
        "queryShapeHash": "B0C3E8C2084EFC015E3BA9D3421960AB5E354976655D3A5F3F5C4F989E308A7A",
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
          "limit": 2,
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.conversas",
          "parsedQuery": {
            "$and": [
              {
                "participantes_ids": {
                  "$size": 2
                }
              },
              {
                "participantes_ids": {
                  "$eq": 2
                }
              },
              {
                "participantes_ids": {
                  "$eq": 5
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "539B463A",
          "planCacheShapeHash": "539B463A",
          "planCacheKey": "E66289D2",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 2,
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 5
                    }
                  }
                ]
              },
              "direction": "forward"
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 1,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 4,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 1,
            "executionTimeMillisEstimate": 0,
            "works": 5,
            "advanced": 1,
            "needTime": 3,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 2,
            "inputStage": {
              "stage": "COLLSCAN",
              "filter": {
                "$and": [
                  {
                    "participantes_ids": {
                      "$size": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 2
                    }
                  },
                  {
                    "participantes_ids": {
                      "$eq": 5
                    }
                  }
                ]
              },
              "nReturned": 1,
              "executionTimeMillisEstimate": 0,
              "works": 5,
              "advanced": 1,
              "needTime": 3,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "direction": "forward",
              "docsExamined": 4
            }
          }
        },
        "queryShapeHash": "B0C3E8C2084EFC015E3BA9D3421960AB5E354976655D3A5F3F5C4F989E308A7A",
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
          "limit": 2,
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · três notificações da Home",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.notificacoes",
          "parsedQuery": {
            "usuario_id": {
              "$eq": 9
            }
          },
          "indexFilterSet": false,
          "queryHash": "A9AB7EE0",
          "planCacheShapeHash": "A9AB7EE0",
          "planCacheKey": "E4B047C2",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 3,
            "inputStage": {
              "stage": "FETCH",
              "inputStage": {
                "stage": "IXSCAN",
                "keyPattern": {
                  "usuario_id": 1,
                  "data_criacao": -1,
                  "_id": -1
                },
                "indexName": "idx_notificacoes_usuario_criacao",
                "isMultiKey": false,
                "multiKeyPaths": {
                  "usuario_id": [],
                  "data_criacao": [],
                  "_id": []
                },
                "isUnique": false,
                "isSparse": false,
                "isPartial": false,
                "indexVersion": 2,
                "direction": "forward",
                "indexBounds": {
                  "usuario_id": [
                    "[9, 9]"
                  ],
                  "data_criacao": [
                    "[MaxKey, MinKey]"
                  ],
                  "_id": [
                    "[MaxKey, MinKey]"
                  ]
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 3,
          "executionTimeMillis": 0,
          "totalKeysExamined": 3,
          "totalDocsExamined": 3,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 3,
            "executionTimeMillisEstimate": 0,
            "works": 4,
            "advanced": 3,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 3,
            "inputStage": {
              "stage": "FETCH",
              "nReturned": 3,
              "executionTimeMillisEstimate": 0,
              "works": 3,
              "advanced": 3,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 0,
              "docsExamined": 3,
              "alreadyHasObj": 0,
              "inputStage": {
                "stage": "IXSCAN",
                "nReturned": 3,
                "executionTimeMillisEstimate": 0,
                "works": 3,
                "advanced": 3,
                "needTime": 0,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 0,
                "keyPattern": {
                  "usuario_id": 1,
                  "data_criacao": -1,
                  "_id": -1
                },
                "indexName": "idx_notificacoes_usuario_criacao",
                "isMultiKey": false,
                "multiKeyPaths": {
                  "usuario_id": [],
                  "data_criacao": [],
                  "_id": []
                },
                "isUnique": false,
                "isSparse": false,
                "isPartial": false,
                "indexVersion": 2,
                "direction": "forward",
                "indexBounds": {
                  "usuario_id": [
                    "[9, 9]"
                  ],
                  "data_criacao": [
                    "[MaxKey, MinKey]"
                  ],
                  "_id": [
                    "[MaxKey, MinKey]"
                  ]
                },
                "keysExamined": 3,
                "seeks": 1,
                "dupsTested": 0,
                "dupsDropped": 0
              }
            }
          }
        },
        "queryShapeHash": "410EE05AE88D34CEE3E984B058E9D4514B7935B4237F71274467CE89DA2BC468",
        "command": {
          "find": "notificacoes",
          "filter": {
            "usuario_id": 9
          },
          "sort": {
            "data_criacao": -1,
            "_id": -1
          },
          "limit": 3,
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.notificacoes",
          "parsedQuery": {
            "usuario_id": {
              "$eq": 9
            }
          },
          "indexFilterSet": false,
          "queryHash": "A9AB7EE0",
          "planCacheShapeHash": "A9AB7EE0",
          "planCacheKey": "E4B047C2",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 3,
            "inputStage": {
              "stage": "FETCH",
              "inputStage": {
                "stage": "IXSCAN",
                "keyPattern": {
                  "usuario_id": 1,
                  "data_criacao": -1,
                  "_id": -1
                },
                "indexName": "idx_notificacoes_usuario_criacao",
                "isMultiKey": false,
                "multiKeyPaths": {
                  "usuario_id": [],
                  "data_criacao": [],
                  "_id": []
                },
                "isUnique": false,
                "isSparse": false,
                "isPartial": false,
                "indexVersion": 2,
                "direction": "forward",
                "indexBounds": {
                  "usuario_id": [
                    "[9, 9]"
                  ],
                  "data_criacao": [
                    "[MaxKey, MinKey]"
                  ],
                  "_id": [
                    "[MaxKey, MinKey]"
                  ]
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 3,
          "executionTimeMillis": 0,
          "totalKeysExamined": 3,
          "totalDocsExamined": 3,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 3,
            "executionTimeMillisEstimate": 0,
            "works": 4,
            "advanced": 3,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 3,
            "inputStage": {
              "stage": "FETCH",
              "nReturned": 3,
              "executionTimeMillisEstimate": 0,
              "works": 3,
              "advanced": 3,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 0,
              "docsExamined": 3,
              "alreadyHasObj": 0,
              "inputStage": {
                "stage": "IXSCAN",
                "nReturned": 3,
                "executionTimeMillisEstimate": 0,
                "works": 3,
                "advanced": 3,
                "needTime": 0,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 0,
                "keyPattern": {
                  "usuario_id": 1,
                  "data_criacao": -1,
                  "_id": -1
                },
                "indexName": "idx_notificacoes_usuario_criacao",
                "isMultiKey": false,
                "multiKeyPaths": {
                  "usuario_id": [],
                  "data_criacao": [],
                  "_id": []
                },
                "isUnique": false,
                "isSparse": false,
                "isPartial": false,
                "indexVersion": 2,
                "direction": "forward",
                "indexBounds": {
                  "usuario_id": [
                    "[9, 9]"
                  ],
                  "data_criacao": [
                    "[MaxKey, MinKey]"
                  ],
                  "_id": [
                    "[MaxKey, MinKey]"
                  ]
                },
                "keysExamined": 3,
                "seeks": 1,
                "dupsTested": 0,
                "dupsDropped": 0
              }
            }
          }
        },
        "queryShapeHash": "410EE05AE88D34CEE3E984B058E9D4514B7935B4237F71274467CE89DA2BC468",
        "command": {
          "find": "notificacoes",
          "filter": {
            "usuario_id": 9
          },
          "sort": {
            "data_criacao": -1,
            "_id": -1
          },
          "limit": 3,
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "IA · notificações",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.notificacoes",
          "parsedQuery": {
            "usuario_id": {
              "$eq": 9
            }
          },
          "indexFilterSet": false,
          "queryHash": "4759EA1F",
          "planCacheShapeHash": "4759EA1F",
          "planCacheKey": "77B18C75",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 5,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 0,
                "mensagem": 1,
                "data_criacao": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "usuario_id": 1,
                    "data_criacao": -1,
                    "_id": -1
                  },
                  "indexName": "idx_notificacoes_usuario_criacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "data_criacao": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[9, 9]"
                    ],
                    "data_criacao": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, MinKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 5,
          "executionTimeMillis": 0,
          "totalKeysExamined": 5,
          "totalDocsExamined": 5,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 5,
            "executionTimeMillisEstimate": 0,
            "works": 6,
            "advanced": 5,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 5,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 5,
              "executionTimeMillisEstimate": 0,
              "works": 5,
              "advanced": 5,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 0,
              "transformBy": {
                "_id": 0,
                "mensagem": 1,
                "data_criacao": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "nReturned": 5,
                "executionTimeMillisEstimate": 0,
                "works": 5,
                "advanced": 5,
                "needTime": 0,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 0,
                "docsExamined": 5,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 5,
                  "executionTimeMillisEstimate": 0,
                  "works": 5,
                  "advanced": 5,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 0,
                  "keyPattern": {
                    "usuario_id": 1,
                    "data_criacao": -1,
                    "_id": -1
                  },
                  "indexName": "idx_notificacoes_usuario_criacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "data_criacao": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[9, 9]"
                    ],
                    "data_criacao": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, MinKey]"
                    ]
                  },
                  "keysExamined": 5,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "B2E79BCD35440A17E6622F561DF2396982B3D6F611A2E486AF8916F85F760497",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.notificacoes",
          "parsedQuery": {
            "usuario_id": {
              "$eq": 9
            }
          },
          "indexFilterSet": false,
          "queryHash": "4759EA1F",
          "planCacheShapeHash": "4759EA1F",
          "planCacheKey": "77B18C75",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 5,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 0,
                "mensagem": 1,
                "data_criacao": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "usuario_id": 1,
                    "data_criacao": -1,
                    "_id": -1
                  },
                  "indexName": "idx_notificacoes_usuario_criacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "data_criacao": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[9, 9]"
                    ],
                    "data_criacao": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, MinKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 5,
          "executionTimeMillis": 0,
          "totalKeysExamined": 5,
          "totalDocsExamined": 5,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 5,
            "executionTimeMillisEstimate": 0,
            "works": 6,
            "advanced": 5,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 5,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 5,
              "executionTimeMillisEstimate": 0,
              "works": 5,
              "advanced": 5,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 0,
              "transformBy": {
                "_id": 0,
                "mensagem": 1,
                "data_criacao": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "nReturned": 5,
                "executionTimeMillisEstimate": 0,
                "works": 5,
                "advanced": 5,
                "needTime": 0,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 0,
                "docsExamined": 5,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 5,
                  "executionTimeMillisEstimate": 0,
                  "works": 5,
                  "advanced": 5,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 0,
                  "keyPattern": {
                    "usuario_id": 1,
                    "data_criacao": -1,
                    "_id": -1
                  },
                  "indexName": "idx_notificacoes_usuario_criacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "data_criacao": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[9, 9]"
                    ],
                    "data_criacao": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, MinKey]"
                    ]
                  },
                  "keysExamined": 5,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "B2E79BCD35440A17E6622F561DF2396982B3D6F611A2E486AF8916F85F760497",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · formulários recebidos",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.formularios",
          "parsedQuery": {
            "$and": [
              {
                "gestor_id": {
                  "$eq": 3
                }
              },
              {
                "workspace_id": {
                  "$eq": 1
                }
              },
              {
                "status": {
                  "$in": [
                    "CONCLUIDO",
                    "PENDENTE"
                  ]
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "6EA004E4",
          "planCacheShapeHash": "6EA004E4",
          "planCacheKey": "86385D6C",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "PROJECTION_DEFAULT",
            "transformBy": {
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
            },
            "inputStage": {
              "stage": "SORT",
              "sortPattern": {
                "criado_em": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "$and": [
                    {
                      "gestor_id": {
                        "$eq": 3
                      }
                    },
                    {
                      "workspace_id": {
                        "$eq": 1
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "CONCLUIDO",
                          "PENDENTE"
                        ]
                      }
                    }
                  ]
                },
                "direction": "forward"
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 5,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 8,
          "executionStages": {
            "isCached": false,
            "stage": "PROJECTION_DEFAULT",
            "nReturned": 5,
            "executionTimeMillisEstimate": 0,
            "works": 15,
            "advanced": 5,
            "needTime": 9,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "transformBy": {
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
            },
            "inputStage": {
              "stage": "SORT",
              "nReturned": 5,
              "executionTimeMillisEstimate": 0,
              "works": 15,
              "advanced": 5,
              "needTime": 9,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "sortPattern": {
                "criado_em": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "totalDataSizeSorted": 8446,
              "usedDisk": false,
              "spills": 0,
              "spilledDataStorageSize": 0,
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "$and": [
                    {
                      "gestor_id": {
                        "$eq": 3
                      }
                    },
                    {
                      "workspace_id": {
                        "$eq": 1
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "CONCLUIDO",
                          "PENDENTE"
                        ]
                      }
                    }
                  ]
                },
                "nReturned": 5,
                "executionTimeMillisEstimate": 0,
                "works": 9,
                "advanced": 5,
                "needTime": 3,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "direction": "forward",
                "docsExamined": 8
              }
            }
          }
        },
        "queryShapeHash": "533B216692F12D28DF2E90C1E56F907B68E5151F4C38073D50588A64795408D6",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.formularios",
          "parsedQuery": {
            "$and": [
              {
                "gestor_id": {
                  "$eq": 3
                }
              },
              {
                "workspace_id": {
                  "$eq": 1
                }
              },
              {
                "status": {
                  "$in": [
                    "CONCLUIDO",
                    "PENDENTE"
                  ]
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "6EA004E4",
          "planCacheShapeHash": "6EA004E4",
          "planCacheKey": "86385D6C",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "PROJECTION_DEFAULT",
            "transformBy": {
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
            },
            "inputStage": {
              "stage": "SORT",
              "sortPattern": {
                "criado_em": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "$and": [
                    {
                      "gestor_id": {
                        "$eq": 3
                      }
                    },
                    {
                      "workspace_id": {
                        "$eq": 1
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "CONCLUIDO",
                          "PENDENTE"
                        ]
                      }
                    }
                  ]
                },
                "direction": "forward"
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 5,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 8,
          "executionStages": {
            "isCached": false,
            "stage": "PROJECTION_DEFAULT",
            "nReturned": 5,
            "executionTimeMillisEstimate": 0,
            "works": 15,
            "advanced": 5,
            "needTime": 9,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "transformBy": {
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
            },
            "inputStage": {
              "stage": "SORT",
              "nReturned": 5,
              "executionTimeMillisEstimate": 0,
              "works": 15,
              "advanced": 5,
              "needTime": 9,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "sortPattern": {
                "criado_em": -1,
                "_id": -1
              },
              "memLimit": 33554432,
              "limitAmount": 10,
              "type": "simple",
              "totalDataSizeSorted": 8446,
              "usedDisk": false,
              "spills": 0,
              "spilledDataStorageSize": 0,
              "inputStage": {
                "stage": "COLLSCAN",
                "filter": {
                  "$and": [
                    {
                      "gestor_id": {
                        "$eq": 3
                      }
                    },
                    {
                      "workspace_id": {
                        "$eq": 1
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "CONCLUIDO",
                          "PENDENTE"
                        ]
                      }
                    }
                  ]
                },
                "nReturned": 5,
                "executionTimeMillisEstimate": 0,
                "works": 9,
                "advanced": 5,
                "needTime": 3,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "direction": "forward",
                "docsExamined": 8
              }
            }
          }
        },
        "queryShapeHash": "533B216692F12D28DF2E90C1E56F907B68E5151F4C38073D50588A64795408D6",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · formulários pendentes da Home",
      "beforePlan": {
        "explainVersion": "1",
        "stages": [
          {
            "$cursor": {
              "queryPlanner": {
                "namespace": "astro.formularios",
                "parsedQuery": {
                  "$and": [
                    {
                      "gestor_id": {
                        "$eq": 3
                      }
                    },
                    {
                      "status": {
                        "$eq": "PENDENTE"
                      }
                    }
                  ]
                },
                "indexFilterSet": false,
                "queryHash": "1FD9B5D8",
                "planCacheShapeHash": "1FD9B5D8",
                "planCacheKey": "82D418C8",
                "optimizationTimeMillis": 0,
                "maxIndexedOrSolutionsReached": false,
                "maxIndexedAndSolutionsReached": false,
                "maxScansToExplodeReached": false,
                "prunedSimilarIndexes": false,
                "winningPlan": {
                  "isCached": false,
                  "stage": "PROJECTION_SIMPLE",
                  "transformBy": {
                    "_id": 1,
                    "data_limite": 1,
                    "titulo": 1
                  },
                  "inputStage": {
                    "stage": "COLLSCAN",
                    "filter": {
                      "$and": [
                        {
                          "gestor_id": {
                            "$eq": 3
                          }
                        },
                        {
                          "status": {
                            "$eq": "PENDENTE"
                          }
                        }
                      ]
                    },
                    "direction": "forward"
                  }
                },
                "rejectedPlans": []
              },
              "executionStats": {
                "executionSuccess": true,
                "nReturned": 1,
                "executionTimeMillis": 0,
                "totalKeysExamined": 0,
                "totalDocsExamined": 8,
                "executionStages": {
                  "isCached": false,
                  "stage": "PROJECTION_SIMPLE",
                  "nReturned": 1,
                  "executionTimeMillisEstimate": 0,
                  "works": 9,
                  "advanced": 1,
                  "needTime": 7,
                  "needYield": 0,
                  "saveState": 1,
                  "restoreState": 1,
                  "isEOF": 1,
                  "transformBy": {
                    "_id": 1,
                    "data_limite": 1,
                    "titulo": 1
                  },
                  "inputStage": {
                    "stage": "COLLSCAN",
                    "filter": {
                      "$and": [
                        {
                          "gestor_id": {
                            "$eq": 3
                          }
                        },
                        {
                          "status": {
                            "$eq": "PENDENTE"
                          }
                        }
                      ]
                    },
                    "nReturned": 1,
                    "executionTimeMillisEstimate": 0,
                    "works": 9,
                    "advanced": 1,
                    "needTime": 7,
                    "needYield": 0,
                    "saveState": 1,
                    "restoreState": 1,
                    "isEOF": 1,
                    "direction": "forward",
                    "docsExamined": 8
                  }
                }
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
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
                          {
                            "$const": null
                          }
                        ]
                      },
                      {
                        "$const": null
                      }
                    ]
                  },
                  {
                    "$const": 1
                  },
                  {
                    "$const": 0
                  }
                ]
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
          },
          {
            "$sort": {
              "sortKey": {
                "_due_date_missing": 1,
                "data_limite": 1,
                "_id": 1
              },
              "limit": 3
            },
            "totalDataSizeSortedBytesEstimate": 480,
            "usedDisk": false,
            "spills": 0,
            "spilledDataStorageSize": 0,
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
          },
          {
            "$project": {
              "_id": true,
              "titulo": true,
              "data_limite": true
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
          }
        ],
        "queryShapeHash": "99D19B6D496BEE000ED1BB9E102D1382AC882FC7731C7DED7BD2B5AE7FB8DDAC",
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
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
          "cursor": {},
          "$db": "astro"
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "stages": [
          {
            "$cursor": {
              "queryPlanner": {
                "namespace": "astro.formularios",
                "parsedQuery": {
                  "$and": [
                    {
                      "gestor_id": {
                        "$eq": 3
                      }
                    },
                    {
                      "status": {
                        "$eq": "PENDENTE"
                      }
                    }
                  ]
                },
                "indexFilterSet": false,
                "queryHash": "1FD9B5D8",
                "planCacheShapeHash": "1FD9B5D8",
                "planCacheKey": "82D418C8",
                "optimizationTimeMillis": 0,
                "maxIndexedOrSolutionsReached": false,
                "maxIndexedAndSolutionsReached": false,
                "maxScansToExplodeReached": false,
                "prunedSimilarIndexes": false,
                "winningPlan": {
                  "isCached": false,
                  "stage": "PROJECTION_SIMPLE",
                  "transformBy": {
                    "_id": 1,
                    "data_limite": 1,
                    "titulo": 1
                  },
                  "inputStage": {
                    "stage": "COLLSCAN",
                    "filter": {
                      "$and": [
                        {
                          "gestor_id": {
                            "$eq": 3
                          }
                        },
                        {
                          "status": {
                            "$eq": "PENDENTE"
                          }
                        }
                      ]
                    },
                    "direction": "forward"
                  }
                },
                "rejectedPlans": []
              },
              "executionStats": {
                "executionSuccess": true,
                "nReturned": 1,
                "executionTimeMillis": 0,
                "totalKeysExamined": 0,
                "totalDocsExamined": 8,
                "executionStages": {
                  "isCached": false,
                  "stage": "PROJECTION_SIMPLE",
                  "nReturned": 1,
                  "executionTimeMillisEstimate": 0,
                  "works": 9,
                  "advanced": 1,
                  "needTime": 7,
                  "needYield": 0,
                  "saveState": 1,
                  "restoreState": 1,
                  "isEOF": 1,
                  "transformBy": {
                    "_id": 1,
                    "data_limite": 1,
                    "titulo": 1
                  },
                  "inputStage": {
                    "stage": "COLLSCAN",
                    "filter": {
                      "$and": [
                        {
                          "gestor_id": {
                            "$eq": 3
                          }
                        },
                        {
                          "status": {
                            "$eq": "PENDENTE"
                          }
                        }
                      ]
                    },
                    "nReturned": 1,
                    "executionTimeMillisEstimate": 0,
                    "works": 9,
                    "advanced": 1,
                    "needTime": 7,
                    "needYield": 0,
                    "saveState": 1,
                    "restoreState": 1,
                    "isEOF": 1,
                    "direction": "forward",
                    "docsExamined": 8
                  }
                }
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
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
                          {
                            "$const": null
                          }
                        ]
                      },
                      {
                        "$const": null
                      }
                    ]
                  },
                  {
                    "$const": 1
                  },
                  {
                    "$const": 0
                  }
                ]
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
          },
          {
            "$sort": {
              "sortKey": {
                "_due_date_missing": 1,
                "data_limite": 1,
                "_id": 1
              },
              "limit": 3
            },
            "totalDataSizeSortedBytesEstimate": 480,
            "usedDisk": false,
            "spills": 0,
            "spilledDataStorageSize": 0,
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
          },
          {
            "$project": {
              "_id": true,
              "titulo": true,
              "data_limite": true
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0
          }
        ],
        "queryShapeHash": "99D19B6D496BEE000ED1BB9E102D1382AC882FC7731C7DED7BD2B5AE7FB8DDAC",
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
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
          "cursor": {},
          "$db": "astro"
        },
        "ok": 1.0
      }
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
      "title": "IA · listagem de sessões",
      "beforePlan": {
        "explainVersion": "1",
        "stages": [
          {
            "$cursor": {
              "queryPlanner": {
                "namespace": "astro.sessoes",
                "parsedQuery": {
                  "usuario_id": {
                    "$eq": "<SESSIONUID>"
                  }
                },
                "indexFilterSet": false,
                "queryHash": "B9C5508D",
                "planCacheShapeHash": "B9C5508D",
                "planCacheKey": "F58F6779",
                "optimizationTimeMillis": 0,
                "maxIndexedOrSolutionsReached": false,
                "maxIndexedAndSolutionsReached": false,
                "maxScansToExplodeReached": false,
                "prunedSimilarIndexes": false,
                "winningPlan": {
                  "isCached": true,
                  "stage": "LIMIT",
                  "limitAmount": 11,
                  "inputStage": {
                    "stage": "PROJECTION_SIMPLE",
                    "transformBy": {
                      "_id": 1,
                      "atualizada_em": 1,
                      "iniciada_em": 1,
                      "mensagens": 1,
                      "status": 1,
                      "titulo": 1,
                      "ultima_mensagem_previa": 1
                    },
                    "inputStage": {
                      "stage": "FETCH",
                      "inputStage": {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "usuario_id": 1,
                          "atualizada_em": -1,
                          "_id": -1
                        },
                        "indexName": "sessoes_usuario_atualizacao",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "atualizada_em": [],
                          "_id": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SESSIONUID>\", \"<SESSIONUID>\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ],
                          "_id": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    }
                  }
                },
                "rejectedPlans": [
                  {
                    "isCached": false,
                    "stage": "PROJECTION_SIMPLE",
                    "transformBy": {
                      "_id": 1,
                      "atualizada_em": 1,
                      "iniciada_em": 1,
                      "mensagens": 1,
                      "status": 1,
                      "titulo": 1,
                      "ultima_mensagem_previa": 1
                    },
                    "inputStage": {
                      "stage": "SORT",
                      "sortPattern": {
                        "atualizada_em": -1,
                        "_id": -1
                      },
                      "memLimit": 33554432,
                      "limitAmount": 11,
                      "type": "simple",
                      "inputStage": {
                        "stage": "FETCH",
                        "inputStage": {
                          "stage": "IXSCAN",
                          "keyPattern": {
                            "usuario_id": 1,
                            "status": 1,
                            "atualizada_em": -1
                          },
                          "indexName": "historico_usuario",
                          "isMultiKey": false,
                          "multiKeyPaths": {
                            "usuario_id": [],
                            "status": [],
                            "atualizada_em": []
                          },
                          "isUnique": false,
                          "isSparse": false,
                          "isPartial": false,
                          "indexVersion": 2,
                          "direction": "forward",
                          "indexBounds": {
                            "usuario_id": [
                              "[\"<SESSIONUID>\", \"<SESSIONUID>\"]"
                            ],
                            "status": [
                              "[MinKey, MaxKey]"
                            ],
                            "atualizada_em": [
                              "[MaxKey, MinKey]"
                            ]
                          }
                        }
                      }
                    }
                  }
                ]
              },
              "executionStats": {
                "executionSuccess": true,
                "nReturned": 11,
                "executionTimeMillis": 0,
                "totalKeysExamined": 11,
                "totalDocsExamined": 11,
                "executionStages": {
                  "isCached": true,
                  "stage": "LIMIT",
                  "nReturned": 11,
                  "executionTimeMillisEstimate": 1,
                  "works": 12,
                  "advanced": 11,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 1,
                  "restoreState": 1,
                  "isEOF": 1,
                  "limitAmount": 11,
                  "inputStage": {
                    "stage": "PROJECTION_SIMPLE",
                    "nReturned": 11,
                    "executionTimeMillisEstimate": 1,
                    "works": 11,
                    "advanced": 11,
                    "needTime": 0,
                    "needYield": 0,
                    "saveState": 1,
                    "restoreState": 1,
                    "isEOF": 0,
                    "transformBy": {
                      "_id": 1,
                      "atualizada_em": 1,
                      "iniciada_em": 1,
                      "mensagens": 1,
                      "status": 1,
                      "titulo": 1,
                      "ultima_mensagem_previa": 1
                    },
                    "inputStage": {
                      "stage": "FETCH",
                      "nReturned": 11,
                      "executionTimeMillisEstimate": 1,
                      "works": 11,
                      "advanced": 11,
                      "needTime": 0,
                      "needYield": 0,
                      "saveState": 1,
                      "restoreState": 1,
                      "isEOF": 0,
                      "docsExamined": 11,
                      "alreadyHasObj": 0,
                      "inputStage": {
                        "stage": "IXSCAN",
                        "nReturned": 11,
                        "executionTimeMillisEstimate": 1,
                        "works": 11,
                        "advanced": 11,
                        "needTime": 0,
                        "needYield": 0,
                        "saveState": 1,
                        "restoreState": 1,
                        "isEOF": 0,
                        "keyPattern": {
                          "usuario_id": 1,
                          "atualizada_em": -1,
                          "_id": -1
                        },
                        "indexName": "sessoes_usuario_atualizacao",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "atualizada_em": [],
                          "_id": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SESSIONUID>\", \"<SESSIONUID>\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ],
                          "_id": [
                            "[MaxKey, MinKey]"
                          ]
                        },
                        "keysExamined": 11,
                        "seeks": 1,
                        "dupsTested": 0,
                        "dupsDropped": 0
                      }
                    }
                  }
                }
              }
            },
            "nReturned": 11,
            "executionTimeMillisEstimate": 0
          },
          {
            "$project": {
              "_id": true,
              "iniciada_em": true,
              "atualizada_em": true,
              "status": true,
              "titulo": true,
              "ultima_mensagem_previa": true,
              "primeira_pergunta": {
                "$arrayElemAt": [
                  {
                    "$filter": {
                      "input": {
                        "$ifNull": [
                          "$mensagens",
                          {
                            "$const": []
                          }
                        ]
                      },
                      "as": "message",
                      "cond": {
                        "$and": [
                          {
                            "$eq": [
                              "$$message.papel",
                              {
                                "$const": "human"
                              }
                            ]
                          },
                          {
                            "$eq": [
                              {
                                "$type": [
                                  "$$message.conteudo"
                                ]
                              },
                              {
                                "$const": "string"
                              }
                            ]
                          }
                        ]
                      }
                    }
                  },
                  {
                    "$const": 0
                  }
                ]
              },
              "ultima_mensagem": {
                "$arrayElemAt": [
                  {
                    "$filter": {
                      "input": {
                        "$ifNull": [
                          "$mensagens",
                          {
                            "$const": []
                          }
                        ]
                      },
                      "as": "message",
                      "cond": {
                        "$and": [
                          {
                            "$in": [
                              "$$message.papel",
                              {
                                "$const": [
                                  "human",
                                  "assistant"
                                ]
                              }
                            ]
                          },
                          {
                            "$eq": [
                              {
                                "$type": [
                                  "$$message.conteudo"
                                ]
                              },
                              {
                                "$const": "string"
                              }
                            ]
                          }
                        ]
                      }
                    }
                  },
                  {
                    "$const": -1
                  }
                ]
              }
            },
            "nReturned": 11,
            "executionTimeMillisEstimate": 0
          }
        ],
        "queryShapeHash": "387D243682493E00868D1262147AF0CB91FA9ADA5073BC0680A55D1EAA0D2142",
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
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
          "cursor": {},
          "$db": "astro"
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "stages": [
          {
            "$cursor": {
              "queryPlanner": {
                "namespace": "astro.sessoes",
                "parsedQuery": {
                  "usuario_id": {
                    "$eq": "<SESSIONUID>"
                  }
                },
                "indexFilterSet": false,
                "queryHash": "B9C5508D",
                "planCacheShapeHash": "B9C5508D",
                "planCacheKey": "F58F6779",
                "optimizationTimeMillis": 0,
                "maxIndexedOrSolutionsReached": false,
                "maxIndexedAndSolutionsReached": false,
                "maxScansToExplodeReached": false,
                "prunedSimilarIndexes": false,
                "winningPlan": {
                  "isCached": true,
                  "stage": "LIMIT",
                  "limitAmount": 11,
                  "inputStage": {
                    "stage": "PROJECTION_SIMPLE",
                    "transformBy": {
                      "_id": 1,
                      "atualizada_em": 1,
                      "iniciada_em": 1,
                      "mensagens": 1,
                      "status": 1,
                      "titulo": 1,
                      "ultima_mensagem_previa": 1
                    },
                    "inputStage": {
                      "stage": "FETCH",
                      "inputStage": {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "usuario_id": 1,
                          "atualizada_em": -1,
                          "_id": -1
                        },
                        "indexName": "sessoes_usuario_atualizacao",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "atualizada_em": [],
                          "_id": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SESSIONUID>\", \"<SESSIONUID>\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ],
                          "_id": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    }
                  }
                },
                "rejectedPlans": [
                  {
                    "isCached": false,
                    "stage": "PROJECTION_SIMPLE",
                    "transformBy": {
                      "_id": 1,
                      "atualizada_em": 1,
                      "iniciada_em": 1,
                      "mensagens": 1,
                      "status": 1,
                      "titulo": 1,
                      "ultima_mensagem_previa": 1
                    },
                    "inputStage": {
                      "stage": "SORT",
                      "sortPattern": {
                        "atualizada_em": -1,
                        "_id": -1
                      },
                      "memLimit": 33554432,
                      "limitAmount": 11,
                      "type": "simple",
                      "inputStage": {
                        "stage": "FETCH",
                        "inputStage": {
                          "stage": "IXSCAN",
                          "keyPattern": {
                            "usuario_id": 1,
                            "status": 1,
                            "atualizada_em": -1
                          },
                          "indexName": "historico_usuario",
                          "isMultiKey": false,
                          "multiKeyPaths": {
                            "usuario_id": [],
                            "status": [],
                            "atualizada_em": []
                          },
                          "isUnique": false,
                          "isSparse": false,
                          "isPartial": false,
                          "indexVersion": 2,
                          "direction": "forward",
                          "indexBounds": {
                            "usuario_id": [
                              "[\"<SESSIONUID>\", \"<SESSIONUID>\"]"
                            ],
                            "status": [
                              "[MinKey, MaxKey]"
                            ],
                            "atualizada_em": [
                              "[MaxKey, MinKey]"
                            ]
                          }
                        }
                      }
                    }
                  }
                ]
              },
              "executionStats": {
                "executionSuccess": true,
                "nReturned": 11,
                "executionTimeMillis": 0,
                "totalKeysExamined": 11,
                "totalDocsExamined": 11,
                "executionStages": {
                  "isCached": true,
                  "stage": "LIMIT",
                  "nReturned": 11,
                  "executionTimeMillisEstimate": 0,
                  "works": 12,
                  "advanced": 11,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 1,
                  "restoreState": 1,
                  "isEOF": 1,
                  "limitAmount": 11,
                  "inputStage": {
                    "stage": "PROJECTION_SIMPLE",
                    "nReturned": 11,
                    "executionTimeMillisEstimate": 0,
                    "works": 11,
                    "advanced": 11,
                    "needTime": 0,
                    "needYield": 0,
                    "saveState": 1,
                    "restoreState": 1,
                    "isEOF": 0,
                    "transformBy": {
                      "_id": 1,
                      "atualizada_em": 1,
                      "iniciada_em": 1,
                      "mensagens": 1,
                      "status": 1,
                      "titulo": 1,
                      "ultima_mensagem_previa": 1
                    },
                    "inputStage": {
                      "stage": "FETCH",
                      "nReturned": 11,
                      "executionTimeMillisEstimate": 0,
                      "works": 11,
                      "advanced": 11,
                      "needTime": 0,
                      "needYield": 0,
                      "saveState": 1,
                      "restoreState": 1,
                      "isEOF": 0,
                      "docsExamined": 11,
                      "alreadyHasObj": 0,
                      "inputStage": {
                        "stage": "IXSCAN",
                        "nReturned": 11,
                        "executionTimeMillisEstimate": 0,
                        "works": 11,
                        "advanced": 11,
                        "needTime": 0,
                        "needYield": 0,
                        "saveState": 1,
                        "restoreState": 1,
                        "isEOF": 0,
                        "keyPattern": {
                          "usuario_id": 1,
                          "atualizada_em": -1,
                          "_id": -1
                        },
                        "indexName": "sessoes_usuario_atualizacao",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "atualizada_em": [],
                          "_id": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SESSIONUID>\", \"<SESSIONUID>\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ],
                          "_id": [
                            "[MaxKey, MinKey]"
                          ]
                        },
                        "keysExamined": 11,
                        "seeks": 1,
                        "dupsTested": 0,
                        "dupsDropped": 0
                      }
                    }
                  }
                }
              }
            },
            "nReturned": 11,
            "executionTimeMillisEstimate": 0
          },
          {
            "$project": {
              "_id": true,
              "iniciada_em": true,
              "atualizada_em": true,
              "status": true,
              "titulo": true,
              "ultima_mensagem_previa": true,
              "primeira_pergunta": {
                "$arrayElemAt": [
                  {
                    "$filter": {
                      "input": {
                        "$ifNull": [
                          "$mensagens",
                          {
                            "$const": []
                          }
                        ]
                      },
                      "as": "message",
                      "cond": {
                        "$and": [
                          {
                            "$eq": [
                              "$$message.papel",
                              {
                                "$const": "human"
                              }
                            ]
                          },
                          {
                            "$eq": [
                              {
                                "$type": [
                                  "$$message.conteudo"
                                ]
                              },
                              {
                                "$const": "string"
                              }
                            ]
                          }
                        ]
                      }
                    }
                  },
                  {
                    "$const": 0
                  }
                ]
              },
              "ultima_mensagem": {
                "$arrayElemAt": [
                  {
                    "$filter": {
                      "input": {
                        "$ifNull": [
                          "$mensagens",
                          {
                            "$const": []
                          }
                        ]
                      },
                      "as": "message",
                      "cond": {
                        "$and": [
                          {
                            "$in": [
                              "$$message.papel",
                              {
                                "$const": [
                                  "human",
                                  "assistant"
                                ]
                              }
                            ]
                          },
                          {
                            "$eq": [
                              {
                                "$type": [
                                  "$$message.conteudo"
                                ]
                              },
                              {
                                "$const": "string"
                              }
                            ]
                          }
                        ]
                      }
                    }
                  },
                  {
                    "$const": -1
                  }
                ]
              }
            },
            "nReturned": 11,
            "executionTimeMillisEstimate": 0
          }
        ],
        "queryShapeHash": "387D243682493E00868D1262147AF0CB91FA9ADA5073BC0680A55D1EAA0D2142",
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
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
          "cursor": {},
          "$db": "astro"
        },
        "ok": 1.0
      }
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
      "title": "IA · recuperação de resumos",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.sessoes",
          "parsedQuery": {
            "$and": [
              {
                "$or": [
                  {
                    "$and": [
                      {
                        "status": {
                          "$eq": "encerrada"
                        }
                      },
                      {
                        "resumo_mensagens": {
                          "$not": {
                            "$exists": true
                          }
                        }
                      }
                    ]
                  },
                  {
                    "$expr": {
                      "$and": [
                        {
                          "$eq": [
                            "$resumo_mensagens",
                            {
                              "$size": [
                                {
                                  "$ifNull": [
                                    "$mensagens",
                                    {
                                      "$const": []
                                    }
                                  ]
                                }
                              ]
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
              {
                "usuario_id": {
                  "$eq": "<SUMMARYUID>"
                }
              },
              {
                "status": {
                  "$in": [
                    "ativa",
                    "encerrada"
                  ]
                }
              },
              {
                "_id": {
                  "$not": {
                    "$eq": "<SESSIONID>"
                  }
                }
              },
              {
                "resumo": {
                  "$not": {
                    "$eq": ""
                  }
                }
              },
              {
                "resumo": {
                  "$type": [
                    2
                  ]
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "D7B63999",
          "planCacheShapeHash": "D7B63999",
          "planCacheKey": "2C8CD6B4",
          "optimizationTimeMillis": 1,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": true,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": true,
            "stage": "LIMIT",
            "limitAmount": 3,
            "inputStage": {
              "stage": "PROJECTION_DEFAULT",
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "$or": [
                        {
                          "$and": [
                            {
                              "resumo_mensagens": {
                                "$not": {
                                  "$exists": true
                                }
                              }
                            },
                            {
                              "status": {
                                "$eq": "encerrada"
                              }
                            }
                          ]
                        },
                        {
                          "$expr": {
                            "$and": [
                              {
                                "$eq": [
                                  "$resumo_mensagens",
                                  {
                                    "$size": [
                                      {
                                        "$ifNull": [
                                          "$mensagens",
                                          {
                                            "$const": []
                                          }
                                        ]
                                      }
                                    ]
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
                    {
                      "resumo": {
                        "$not": {
                          "$eq": ""
                        }
                      }
                    },
                    {
                      "resumo": {
                        "$type": [
                          2
                        ]
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "ativa",
                          "encerrada"
                        ]
                      }
                    }
                  ]
                },
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "usuario_id": 1,
                    "atualizada_em": -1,
                    "_id": -1
                  },
                  "indexName": "sessoes_usuario_atualizacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "atualizada_em": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                    ],
                    "atualizada_em": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, \"<SESSIONID>\")",
                      "(\"<SESSIONID>\", MinKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": [
            {
              "isCached": false,
              "stage": "PROJECTION_DEFAULT",
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "atualizada_em": -1
                },
                "memLimit": 33554432,
                "limitAmount": 3,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "_id": {
                          "$not": {
                            "$eq": "<SESSIONID>"
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      },
                      {
                        "usuario_id": {
                          "$eq": "<SUMMARYUID>"
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "IXSCAN",
                    "keyPattern": {
                      "status": 1,
                      "ultima_mensagem_em": 1
                    },
                    "indexName": "sessoes_inatividade_resumo",
                    "isMultiKey": false,
                    "multiKeyPaths": {
                      "status": [],
                      "ultima_mensagem_em": []
                    },
                    "isUnique": false,
                    "isSparse": false,
                    "isPartial": false,
                    "indexVersion": 2,
                    "direction": "forward",
                    "indexBounds": {
                      "status": [
                        "[\"ativa\", \"ativa\"]",
                        "[\"encerrada\", \"encerrada\"]"
                      ],
                      "ultima_mensagem_em": [
                        "[MinKey, MaxKey]"
                      ]
                    }
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "LIMIT",
              "limitAmount": 3,
              "inputStage": {
                "stage": "PROJECTION_DEFAULT",
                "transformBy": {
                  "resumo": 1,
                  "iniciada_em": 1,
                  "mensagens": {
                    "$slice": -6
                  }
                },
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "_id": {
                          "$not": {
                            "$eq": "<SESSIONID>"
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      },
                      {
                        "usuario_id": {
                          "$eq": "<SUMMARYUID>"
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "SORT_MERGE",
                    "sortPattern": {
                      "atualizada_em": -1
                    },
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "status": 1,
                          "atualizada_em": 1
                        },
                        "indexName": "sessoes_inatividade_legado",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "backward",
                        "indexBounds": {
                          "status": [
                            "[\"encerrada\", \"encerrada\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "status": 1,
                          "atualizada_em": 1
                        },
                        "indexName": "sessoes_inatividade_legado",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "backward",
                        "indexBounds": {
                          "status": [
                            "[\"ativa\", \"ativa\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "LIMIT",
              "limitAmount": 3,
              "inputStage": {
                "stage": "PROJECTION_DEFAULT",
                "transformBy": {
                  "resumo": 1,
                  "iniciada_em": 1,
                  "mensagens": {
                    "$slice": -6
                  }
                },
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "_id": {
                          "$not": {
                            "$eq": "<SESSIONID>"
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "SORT_MERGE",
                    "sortPattern": {
                      "atualizada_em": -1
                    },
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "usuario_id": 1,
                          "status": 1,
                          "atualizada_em": -1
                        },
                        "indexName": "historico_usuario",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                          ],
                          "status": [
                            "[\"ativa\", \"ativa\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "usuario_id": 1,
                          "status": 1,
                          "atualizada_em": -1
                        },
                        "indexName": "historico_usuario",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                          ],
                          "status": [
                            "[\"encerrada\", \"encerrada\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "PROJECTION_DEFAULT",
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "atualizada_em": -1
                },
                "memLimit": 33554432,
                "limitAmount": 3,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      },
                      {
                        "status": {
                          "$in": [
                            "ativa",
                            "encerrada"
                          ]
                        }
                      },
                      {
                        "usuario_id": {
                          "$eq": "<SUMMARYUID>"
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "IXSCAN",
                    "keyPattern": {
                      "_id": 1
                    },
                    "indexName": "_id_",
                    "isMultiKey": false,
                    "isUnique": true,
                    "isSparse": false,
                    "isPartial": false,
                    "indexVersion": 2,
                    "direction": "forward",
                    "indexBounds": {
                      "_id": [
                        "[MinKey, \"<SESSIONID>\")",
                        "(\"<SESSIONID>\", MaxKey]"
                      ]
                    }
                  }
                }
              }
            }
          ]
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 0,
          "executionTimeMillis": 1,
          "totalKeysExamined": 21,
          "totalDocsExamined": 20,
          "executionStages": {
            "isCached": true,
            "stage": "LIMIT",
            "nReturned": 0,
            "executionTimeMillisEstimate": 0,
            "works": 22,
            "advanced": 0,
            "needTime": 20,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 3,
            "inputStage": {
              "stage": "PROJECTION_DEFAULT",
              "nReturned": 0,
              "executionTimeMillisEstimate": 0,
              "works": 22,
              "advanced": 0,
              "needTime": 20,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "$or": [
                        {
                          "$and": [
                            {
                              "resumo_mensagens": {
                                "$not": {
                                  "$exists": true
                                }
                              }
                            },
                            {
                              "status": {
                                "$eq": "encerrada"
                              }
                            }
                          ]
                        },
                        {
                          "$expr": {
                            "$and": [
                              {
                                "$eq": [
                                  "$resumo_mensagens",
                                  {
                                    "$size": [
                                      {
                                        "$ifNull": [
                                          "$mensagens",
                                          {
                                            "$const": []
                                          }
                                        ]
                                      }
                                    ]
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
                    {
                      "resumo": {
                        "$not": {
                          "$eq": ""
                        }
                      }
                    },
                    {
                      "resumo": {
                        "$type": [
                          2
                        ]
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "ativa",
                          "encerrada"
                        ]
                      }
                    }
                  ]
                },
                "nReturned": 0,
                "executionTimeMillisEstimate": 0,
                "works": 22,
                "advanced": 0,
                "needTime": 20,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "docsExamined": 20,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 20,
                  "executionTimeMillisEstimate": 0,
                  "works": 21,
                  "advanced": 20,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 1,
                  "keyPattern": {
                    "usuario_id": 1,
                    "atualizada_em": -1,
                    "_id": -1
                  },
                  "indexName": "sessoes_usuario_atualizacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "atualizada_em": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                    ],
                    "atualizada_em": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, \"<SESSIONID>\")",
                      "(\"<SESSIONID>\", MinKey]"
                    ]
                  },
                  "keysExamined": 21,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "B2AC0ED08ED390F35E60CE9F4A504661252D95F95B2A3D638735F9D747DAB5CD",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.sessoes",
          "parsedQuery": {
            "$and": [
              {
                "$or": [
                  {
                    "$and": [
                      {
                        "status": {
                          "$eq": "encerrada"
                        }
                      },
                      {
                        "resumo_mensagens": {
                          "$not": {
                            "$exists": true
                          }
                        }
                      }
                    ]
                  },
                  {
                    "$expr": {
                      "$and": [
                        {
                          "$eq": [
                            "$resumo_mensagens",
                            {
                              "$size": [
                                {
                                  "$ifNull": [
                                    "$mensagens",
                                    {
                                      "$const": []
                                    }
                                  ]
                                }
                              ]
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
              {
                "usuario_id": {
                  "$eq": "<SUMMARYUID>"
                }
              },
              {
                "status": {
                  "$in": [
                    "ativa",
                    "encerrada"
                  ]
                }
              },
              {
                "_id": {
                  "$not": {
                    "$eq": "<SESSIONID>"
                  }
                }
              },
              {
                "resumo": {
                  "$not": {
                    "$eq": ""
                  }
                }
              },
              {
                "resumo": {
                  "$type": [
                    2
                  ]
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "D7B63999",
          "planCacheShapeHash": "D7B63999",
          "planCacheKey": "2C8CD6B4",
          "optimizationTimeMillis": 1,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": true,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": true,
            "stage": "LIMIT",
            "limitAmount": 3,
            "inputStage": {
              "stage": "PROJECTION_DEFAULT",
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "$or": [
                        {
                          "$and": [
                            {
                              "resumo_mensagens": {
                                "$not": {
                                  "$exists": true
                                }
                              }
                            },
                            {
                              "status": {
                                "$eq": "encerrada"
                              }
                            }
                          ]
                        },
                        {
                          "$expr": {
                            "$and": [
                              {
                                "$eq": [
                                  "$resumo_mensagens",
                                  {
                                    "$size": [
                                      {
                                        "$ifNull": [
                                          "$mensagens",
                                          {
                                            "$const": []
                                          }
                                        ]
                                      }
                                    ]
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
                    {
                      "resumo": {
                        "$not": {
                          "$eq": ""
                        }
                      }
                    },
                    {
                      "resumo": {
                        "$type": [
                          2
                        ]
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "ativa",
                          "encerrada"
                        ]
                      }
                    }
                  ]
                },
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "usuario_id": 1,
                    "atualizada_em": -1,
                    "_id": -1
                  },
                  "indexName": "sessoes_usuario_atualizacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "atualizada_em": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                    ],
                    "atualizada_em": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, \"<SESSIONID>\")",
                      "(\"<SESSIONID>\", MinKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": [
            {
              "isCached": false,
              "stage": "PROJECTION_DEFAULT",
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "atualizada_em": -1
                },
                "memLimit": 33554432,
                "limitAmount": 3,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "_id": {
                          "$not": {
                            "$eq": "<SESSIONID>"
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      },
                      {
                        "usuario_id": {
                          "$eq": "<SUMMARYUID>"
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "IXSCAN",
                    "keyPattern": {
                      "status": 1,
                      "ultima_mensagem_em": 1
                    },
                    "indexName": "sessoes_inatividade_resumo",
                    "isMultiKey": false,
                    "multiKeyPaths": {
                      "status": [],
                      "ultima_mensagem_em": []
                    },
                    "isUnique": false,
                    "isSparse": false,
                    "isPartial": false,
                    "indexVersion": 2,
                    "direction": "forward",
                    "indexBounds": {
                      "status": [
                        "[\"ativa\", \"ativa\"]",
                        "[\"encerrada\", \"encerrada\"]"
                      ],
                      "ultima_mensagem_em": [
                        "[MinKey, MaxKey]"
                      ]
                    }
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "LIMIT",
              "limitAmount": 3,
              "inputStage": {
                "stage": "PROJECTION_DEFAULT",
                "transformBy": {
                  "resumo": 1,
                  "iniciada_em": 1,
                  "mensagens": {
                    "$slice": -6
                  }
                },
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "_id": {
                          "$not": {
                            "$eq": "<SESSIONID>"
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      },
                      {
                        "usuario_id": {
                          "$eq": "<SUMMARYUID>"
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "SORT_MERGE",
                    "sortPattern": {
                      "atualizada_em": -1
                    },
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "status": 1,
                          "atualizada_em": 1
                        },
                        "indexName": "sessoes_inatividade_legado",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "backward",
                        "indexBounds": {
                          "status": [
                            "[\"encerrada\", \"encerrada\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "status": 1,
                          "atualizada_em": 1
                        },
                        "indexName": "sessoes_inatividade_legado",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "backward",
                        "indexBounds": {
                          "status": [
                            "[\"ativa\", \"ativa\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "LIMIT",
              "limitAmount": 3,
              "inputStage": {
                "stage": "PROJECTION_DEFAULT",
                "transformBy": {
                  "resumo": 1,
                  "iniciada_em": 1,
                  "mensagens": {
                    "$slice": -6
                  }
                },
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "_id": {
                          "$not": {
                            "$eq": "<SESSIONID>"
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "SORT_MERGE",
                    "sortPattern": {
                      "atualizada_em": -1
                    },
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "usuario_id": 1,
                          "status": 1,
                          "atualizada_em": -1
                        },
                        "indexName": "historico_usuario",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                          ],
                          "status": [
                            "[\"ativa\", \"ativa\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "usuario_id": 1,
                          "status": 1,
                          "atualizada_em": -1
                        },
                        "indexName": "historico_usuario",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "usuario_id": [],
                          "status": [],
                          "atualizada_em": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "usuario_id": [
                            "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                          ],
                          "status": [
                            "[\"encerrada\", \"encerrada\"]"
                          ],
                          "atualizada_em": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              "isCached": false,
              "stage": "PROJECTION_DEFAULT",
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "atualizada_em": -1
                },
                "memLimit": 33554432,
                "limitAmount": 3,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "filter": {
                    "$and": [
                      {
                        "$or": [
                          {
                            "$and": [
                              {
                                "resumo_mensagens": {
                                  "$not": {
                                    "$exists": true
                                  }
                                }
                              },
                              {
                                "status": {
                                  "$eq": "encerrada"
                                }
                              }
                            ]
                          },
                          {
                            "$expr": {
                              "$and": [
                                {
                                  "$eq": [
                                    "$resumo_mensagens",
                                    {
                                      "$size": [
                                        {
                                          "$ifNull": [
                                            "$mensagens",
                                            {
                                              "$const": []
                                            }
                                          ]
                                        }
                                      ]
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
                      {
                        "resumo": {
                          "$not": {
                            "$eq": ""
                          }
                        }
                      },
                      {
                        "resumo": {
                          "$type": [
                            2
                          ]
                        }
                      },
                      {
                        "status": {
                          "$in": [
                            "ativa",
                            "encerrada"
                          ]
                        }
                      },
                      {
                        "usuario_id": {
                          "$eq": "<SUMMARYUID>"
                        }
                      }
                    ]
                  },
                  "inputStage": {
                    "stage": "IXSCAN",
                    "keyPattern": {
                      "_id": 1
                    },
                    "indexName": "_id_",
                    "isMultiKey": false,
                    "isUnique": true,
                    "isSparse": false,
                    "isPartial": false,
                    "indexVersion": 2,
                    "direction": "forward",
                    "indexBounds": {
                      "_id": [
                        "[MinKey, \"<SESSIONID>\")",
                        "(\"<SESSIONID>\", MaxKey]"
                      ]
                    }
                  }
                }
              }
            }
          ]
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 0,
          "executionTimeMillis": 1,
          "totalKeysExamined": 21,
          "totalDocsExamined": 20,
          "executionStages": {
            "isCached": true,
            "stage": "LIMIT",
            "nReturned": 0,
            "executionTimeMillisEstimate": 0,
            "works": 22,
            "advanced": 0,
            "needTime": 20,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 3,
            "inputStage": {
              "stage": "PROJECTION_DEFAULT",
              "nReturned": 0,
              "executionTimeMillisEstimate": 0,
              "works": 22,
              "advanced": 0,
              "needTime": 20,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "transformBy": {
                "resumo": 1,
                "iniciada_em": 1,
                "mensagens": {
                  "$slice": -6
                }
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "$or": [
                        {
                          "$and": [
                            {
                              "resumo_mensagens": {
                                "$not": {
                                  "$exists": true
                                }
                              }
                            },
                            {
                              "status": {
                                "$eq": "encerrada"
                              }
                            }
                          ]
                        },
                        {
                          "$expr": {
                            "$and": [
                              {
                                "$eq": [
                                  "$resumo_mensagens",
                                  {
                                    "$size": [
                                      {
                                        "$ifNull": [
                                          "$mensagens",
                                          {
                                            "$const": []
                                          }
                                        ]
                                      }
                                    ]
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
                    {
                      "resumo": {
                        "$not": {
                          "$eq": ""
                        }
                      }
                    },
                    {
                      "resumo": {
                        "$type": [
                          2
                        ]
                      }
                    },
                    {
                      "status": {
                        "$in": [
                          "ativa",
                          "encerrada"
                        ]
                      }
                    }
                  ]
                },
                "nReturned": 0,
                "executionTimeMillisEstimate": 0,
                "works": 22,
                "advanced": 0,
                "needTime": 20,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "docsExamined": 20,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 20,
                  "executionTimeMillisEstimate": 0,
                  "works": 21,
                  "advanced": 20,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 1,
                  "keyPattern": {
                    "usuario_id": 1,
                    "atualizada_em": -1,
                    "_id": -1
                  },
                  "indexName": "sessoes_usuario_atualizacao",
                  "isMultiKey": false,
                  "multiKeyPaths": {
                    "usuario_id": [],
                    "atualizada_em": [],
                    "_id": []
                  },
                  "isUnique": false,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "usuario_id": [
                      "[\"<SUMMARYUID>\", \"<SUMMARYUID>\"]"
                    ],
                    "atualizada_em": [
                      "[MaxKey, MinKey]"
                    ],
                    "_id": [
                      "[MaxKey, \"<SESSIONID>\")",
                      "(\"<SESSIONID>\", MinKey]"
                    ]
                  },
                  "keysExamined": 21,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "B2AC0ED08ED390F35E60CE9F4A504661252D95F95B2A3D638735F9D747DAB5CD",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "IA · sessão por ID",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.sessoes",
          "parsedQuery": {
            "$and": [
              {
                "_id": {
                  "$eq": "<SESSIONID>"
                }
              },
              {
                "usuario_id": {
                  "$eq": "<SESSIONUID>"
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "995BA89F",
          "planCacheShapeHash": "995BA89F",
          "planCacheKey": "FCB74358",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "usuario_id": {
                "$eq": "<SESSIONUID>"
              }
            },
            "inputStage": {
              "stage": "IXSCAN",
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<SESSIONID>\", \"<SESSIONID>\"]"
                ]
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 1,
          "executionTimeMillis": 0,
          "totalKeysExamined": 1,
          "totalDocsExamined": 1,
          "executionStages": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "usuario_id": {
                "$eq": "<SESSIONUID>"
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0,
            "works": 2,
            "advanced": 1,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "docsExamined": 1,
            "alreadyHasObj": 0,
            "inputStage": {
              "stage": "IXSCAN",
              "nReturned": 1,
              "executionTimeMillisEstimate": 0,
              "works": 2,
              "advanced": 1,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<SESSIONID>\", \"<SESSIONID>\"]"
                ]
              },
              "keysExamined": 1,
              "seeks": 1,
              "dupsTested": 0,
              "dupsDropped": 0
            }
          }
        },
        "queryShapeHash": "E5D541CDCA0EF1CF911609A1BF6CD690916549AF77C3F4413B97D7E03B5B5384",
        "command": {
          "find": "sessoes",
          "filter": {
            "_id": "<SESSIONID>",
            "usuario_id": "<SESSIONUID>"
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.sessoes",
          "parsedQuery": {
            "$and": [
              {
                "_id": {
                  "$eq": "<SESSIONID>"
                }
              },
              {
                "usuario_id": {
                  "$eq": "<SESSIONUID>"
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "995BA89F",
          "planCacheShapeHash": "995BA89F",
          "planCacheKey": "FCB74358",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "usuario_id": {
                "$eq": "<SESSIONUID>"
              }
            },
            "inputStage": {
              "stage": "IXSCAN",
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<SESSIONID>\", \"<SESSIONID>\"]"
                ]
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 1,
          "executionTimeMillis": 0,
          "totalKeysExamined": 1,
          "totalDocsExamined": 1,
          "executionStages": {
            "isCached": false,
            "stage": "FETCH",
            "filter": {
              "usuario_id": {
                "$eq": "<SESSIONUID>"
              }
            },
            "nReturned": 1,
            "executionTimeMillisEstimate": 0,
            "works": 2,
            "advanced": 1,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "docsExamined": 1,
            "alreadyHasObj": 0,
            "inputStage": {
              "stage": "IXSCAN",
              "nReturned": 1,
              "executionTimeMillisEstimate": 0,
              "works": 2,
              "advanced": 1,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[\"<SESSIONID>\", \"<SESSIONID>\"]"
                ]
              },
              "keysExamined": 1,
              "seeks": 1,
              "dupsTested": 0,
              "dupsDropped": 0
            }
          }
        },
        "queryShapeHash": "E5D541CDCA0EF1CF911609A1BF6CD690916549AF77C3F4413B97D7E03B5B5384",
        "command": {
          "find": "sessoes",
          "filter": {
            "_id": "<SESSIONID>",
            "usuario_id": "<SESSIONUID>"
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "Java · catálogo de NRs",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.nrs",
          "parsedQuery": {},
          "indexFilterSet": false,
          "queryHash": "AD0C08E7",
          "planCacheShapeHash": "AD0C08E7",
          "planCacheKey": "6EC86E2B",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "FETCH",
            "inputStage": {
              "stage": "IXSCAN",
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[MinKey, MaxKey]"
                ]
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 38,
          "executionTimeMillis": 0,
          "totalKeysExamined": 38,
          "totalDocsExamined": 38,
          "executionStages": {
            "isCached": false,
            "stage": "FETCH",
            "nReturned": 38,
            "executionTimeMillisEstimate": 0,
            "works": 39,
            "advanced": 38,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "docsExamined": 38,
            "alreadyHasObj": 0,
            "inputStage": {
              "stage": "IXSCAN",
              "nReturned": 38,
              "executionTimeMillisEstimate": 0,
              "works": 39,
              "advanced": 38,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[MinKey, MaxKey]"
                ]
              },
              "keysExamined": 38,
              "seeks": 1,
              "dupsTested": 0,
              "dupsDropped": 0
            }
          }
        },
        "queryShapeHash": "C2B090AA4FD004EF6C167E9122140BAE2C6FEEEAE026F3BB07B8080647959E5D",
        "command": {
          "find": "nrs",
          "filter": {},
          "sort": {
            "_id": 1
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.nrs",
          "parsedQuery": {},
          "indexFilterSet": false,
          "queryHash": "AD0C08E7",
          "planCacheShapeHash": "AD0C08E7",
          "planCacheKey": "6EC86E2B",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "FETCH",
            "inputStage": {
              "stage": "IXSCAN",
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[MinKey, MaxKey]"
                ]
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 38,
          "executionTimeMillis": 0,
          "totalKeysExamined": 38,
          "totalDocsExamined": 38,
          "executionStages": {
            "isCached": false,
            "stage": "FETCH",
            "nReturned": 38,
            "executionTimeMillisEstimate": 0,
            "works": 39,
            "advanced": 38,
            "needTime": 0,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "docsExamined": 38,
            "alreadyHasObj": 0,
            "inputStage": {
              "stage": "IXSCAN",
              "nReturned": 38,
              "executionTimeMillisEstimate": 0,
              "works": 39,
              "advanced": 38,
              "needTime": 0,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "keyPattern": {
                "_id": 1
              },
              "indexName": "_id_",
              "isMultiKey": false,
              "isUnique": true,
              "isSparse": false,
              "isPartial": false,
              "indexVersion": 2,
              "direction": "forward",
              "indexBounds": {
                "_id": [
                  "[MinKey, MaxKey]"
                ]
              },
              "keysExamined": 38,
              "seeks": 1,
              "dupsTested": 0,
              "dupsDropped": 0
            }
          }
        },
        "queryShapeHash": "C2B090AA4FD004EF6C167E9122140BAE2C6FEEEAE026F3BB07B8080647959E5D",
        "command": {
          "find": "nrs",
          "filter": {},
          "sort": {
            "_id": 1
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "IA · NRs candidatas",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.nrs",
          "parsedQuery": {
            "$and": [
              {
                "usabilidade": {
                  "$regex": "^(?:Colaborador|Funcion[aá]rio)$",
                  "$options": "iu"
                }
              },
              {
                "revogada": {
                  "$not": {
                    "$eq": true
                  }
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "D81576EB",
          "planCacheShapeHash": "D81576EB",
          "planCacheKey": "6A14D744",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 50,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 1,
                "nome": 1,
                "objetivo": 1,
                "descricao": 1,
                "aplicabilidade": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "usabilidade": {
                        "$regex": "^(?:Colaborador|Funcion[aá]rio)$",
                        "$options": "iu"
                      }
                    },
                    {
                      "revogada": {
                        "$not": {
                          "$eq": true
                        }
                      }
                    }
                  ]
                },
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "_id": 1
                  },
                  "indexName": "_id_",
                  "isMultiKey": false,
                  "isUnique": true,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "_id": [
                      "[MinKey, MaxKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 10,
          "executionTimeMillis": 0,
          "totalKeysExamined": 38,
          "totalDocsExamined": 38,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 10,
            "executionTimeMillisEstimate": 0,
            "works": 39,
            "advanced": 10,
            "needTime": 28,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 50,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 10,
              "executionTimeMillisEstimate": 0,
              "works": 39,
              "advanced": 10,
              "needTime": 28,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "transformBy": {
                "_id": 1,
                "nome": 1,
                "objetivo": 1,
                "descricao": 1,
                "aplicabilidade": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "usabilidade": {
                        "$regex": "^(?:Colaborador|Funcion[aá]rio)$",
                        "$options": "iu"
                      }
                    },
                    {
                      "revogada": {
                        "$not": {
                          "$eq": true
                        }
                      }
                    }
                  ]
                },
                "nReturned": 10,
                "executionTimeMillisEstimate": 0,
                "works": 39,
                "advanced": 10,
                "needTime": 28,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "docsExamined": 38,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 38,
                  "executionTimeMillisEstimate": 0,
                  "works": 39,
                  "advanced": 38,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 1,
                  "keyPattern": {
                    "_id": 1
                  },
                  "indexName": "_id_",
                  "isMultiKey": false,
                  "isUnique": true,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "_id": [
                      "[MinKey, MaxKey]"
                    ]
                  },
                  "keysExamined": 38,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "DA2E25706799579BF6EE5F8C486DFCBFCF9C7EF7110D3C55EDBB1E70A7FA2087",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.nrs",
          "parsedQuery": {
            "$and": [
              {
                "usabilidade": {
                  "$regex": "^(?:Colaborador|Funcion[aá]rio)$",
                  "$options": "iu"
                }
              },
              {
                "revogada": {
                  "$not": {
                    "$eq": true
                  }
                }
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "D81576EB",
          "planCacheShapeHash": "D81576EB",
          "planCacheKey": "6A14D744",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "LIMIT",
            "limitAmount": 50,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 1,
                "nome": 1,
                "objetivo": 1,
                "descricao": 1,
                "aplicabilidade": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "usabilidade": {
                        "$regex": "^(?:Colaborador|Funcion[aá]rio)$",
                        "$options": "iu"
                      }
                    },
                    {
                      "revogada": {
                        "$not": {
                          "$eq": true
                        }
                      }
                    }
                  ]
                },
                "inputStage": {
                  "stage": "IXSCAN",
                  "keyPattern": {
                    "_id": 1
                  },
                  "indexName": "_id_",
                  "isMultiKey": false,
                  "isUnique": true,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "_id": [
                      "[MinKey, MaxKey]"
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 10,
          "executionTimeMillis": 0,
          "totalKeysExamined": 38,
          "totalDocsExamined": 38,
          "executionStages": {
            "isCached": false,
            "stage": "LIMIT",
            "nReturned": 10,
            "executionTimeMillisEstimate": 0,
            "works": 39,
            "advanced": 10,
            "needTime": 28,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "limitAmount": 50,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 10,
              "executionTimeMillisEstimate": 0,
              "works": 39,
              "advanced": 10,
              "needTime": 28,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "transformBy": {
                "_id": 1,
                "nome": 1,
                "objetivo": 1,
                "descricao": 1,
                "aplicabilidade": 1
              },
              "inputStage": {
                "stage": "FETCH",
                "filter": {
                  "$and": [
                    {
                      "usabilidade": {
                        "$regex": "^(?:Colaborador|Funcion[aá]rio)$",
                        "$options": "iu"
                      }
                    },
                    {
                      "revogada": {
                        "$not": {
                          "$eq": true
                        }
                      }
                    }
                  ]
                },
                "nReturned": 10,
                "executionTimeMillisEstimate": 0,
                "works": 39,
                "advanced": 10,
                "needTime": 28,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "docsExamined": 38,
                "alreadyHasObj": 0,
                "inputStage": {
                  "stage": "IXSCAN",
                  "nReturned": 38,
                  "executionTimeMillisEstimate": 0,
                  "works": 39,
                  "advanced": 38,
                  "needTime": 0,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 1,
                  "keyPattern": {
                    "_id": 1
                  },
                  "indexName": "_id_",
                  "isMultiKey": false,
                  "isUnique": true,
                  "isSparse": false,
                  "isPartial": false,
                  "indexVersion": 2,
                  "direction": "forward",
                  "indexBounds": {
                    "_id": [
                      "[MinKey, MaxKey]"
                    ]
                  },
                  "keysExamined": 38,
                  "seeks": 1,
                  "dupsTested": 0,
                  "dupsDropped": 0
                }
              }
            }
          }
        },
        "queryShapeHash": "DA2E25706799579BF6EE5F8C486DFCBFCF9C7EF7110D3C55EDBB1E70A7FA2087",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
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
      "title": "IA · histórico por destinatário (sem dados compatíveis)",
      "beforePlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "$or": [
              {
                "$and": [
                  {
                    "destinatario_id": {
                      "$eq": 5
                    }
                  },
                  {
                    "remetente_id": {
                      "$eq": 2
                    }
                  }
                ]
              },
              {
                "$and": [
                  {
                    "destinatario_id": {
                      "$eq": 2
                    }
                  },
                  {
                    "remetente_id": {
                      "$eq": 5
                    }
                  }
                ]
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "11917A8E",
          "planCacheShapeHash": "11917A8E",
          "planCacheKey": "FC7111B2",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "SUBPLAN",
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 0,
                "remetente_id": 1,
                "destinatario_id": 1,
                "mensagem": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "data": -1,
                  "_id": -1
                },
                "memLimit": 33554432,
                "limitAmount": 5,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "inputStage": {
                    "stage": "OR",
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[2, 2]"
                          ],
                          "destinatario_id": [
                            "[5, 5]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[5, 5]"
                          ],
                          "destinatario_id": [
                            "[2, 2]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 0,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 0,
          "executionStages": {
            "isCached": false,
            "stage": "SUBPLAN",
            "nReturned": 0,
            "executionTimeMillisEstimate": 0,
            "works": 3,
            "advanced": 0,
            "needTime": 2,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 0,
              "executionTimeMillisEstimate": 0,
              "works": 3,
              "advanced": 0,
              "needTime": 2,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "transformBy": {
                "_id": 0,
                "remetente_id": 1,
                "destinatario_id": 1,
                "mensagem": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "SORT",
                "nReturned": 0,
                "executionTimeMillisEstimate": 0,
                "works": 3,
                "advanced": 0,
                "needTime": 2,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "sortPattern": {
                  "data": -1,
                  "_id": -1
                },
                "memLimit": 33554432,
                "limitAmount": 5,
                "type": "simple",
                "totalDataSizeSorted": 0,
                "usedDisk": false,
                "spills": 0,
                "spilledDataStorageSize": 0,
                "inputStage": {
                  "stage": "FETCH",
                  "nReturned": 0,
                  "executionTimeMillisEstimate": 0,
                  "works": 2,
                  "advanced": 0,
                  "needTime": 1,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 1,
                  "docsExamined": 0,
                  "alreadyHasObj": 0,
                  "inputStage": {
                    "stage": "OR",
                    "nReturned": 0,
                    "executionTimeMillisEstimate": 0,
                    "works": 2,
                    "advanced": 0,
                    "needTime": 1,
                    "needYield": 0,
                    "saveState": 0,
                    "restoreState": 0,
                    "isEOF": 1,
                    "dupsTested": 0,
                    "dupsDropped": 0,
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "nReturned": 0,
                        "executionTimeMillisEstimate": 0,
                        "works": 1,
                        "advanced": 0,
                        "needTime": 0,
                        "needYield": 0,
                        "saveState": 0,
                        "restoreState": 0,
                        "isEOF": 1,
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[2, 2]"
                          ],
                          "destinatario_id": [
                            "[5, 5]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        },
                        "keysExamined": 0,
                        "seeks": 1,
                        "dupsTested": 0,
                        "dupsDropped": 0
                      },
                      {
                        "stage": "IXSCAN",
                        "nReturned": 0,
                        "executionTimeMillisEstimate": 0,
                        "works": 1,
                        "advanced": 0,
                        "needTime": 0,
                        "needYield": 0,
                        "saveState": 0,
                        "restoreState": 0,
                        "isEOF": 1,
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[5, 5]"
                          ],
                          "destinatario_id": [
                            "[2, 2]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        },
                        "keysExamined": 0,
                        "seeks": 1,
                        "dupsTested": 0,
                        "dupsDropped": 0
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        "queryShapeHash": "A56532A34BD10345267C6ABB549C05DAB4E16E2F6C8ADDF47E0ECDF6519851EA",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      },
      "afterPlan": {
        "explainVersion": "1",
        "queryPlanner": {
          "namespace": "astro.mensagens",
          "parsedQuery": {
            "$or": [
              {
                "$and": [
                  {
                    "destinatario_id": {
                      "$eq": 5
                    }
                  },
                  {
                    "remetente_id": {
                      "$eq": 2
                    }
                  }
                ]
              },
              {
                "$and": [
                  {
                    "destinatario_id": {
                      "$eq": 2
                    }
                  },
                  {
                    "remetente_id": {
                      "$eq": 5
                    }
                  }
                ]
              }
            ]
          },
          "indexFilterSet": false,
          "queryHash": "11917A8E",
          "planCacheShapeHash": "11917A8E",
          "planCacheKey": "FC7111B2",
          "optimizationTimeMillis": 0,
          "maxIndexedOrSolutionsReached": false,
          "maxIndexedAndSolutionsReached": false,
          "maxScansToExplodeReached": false,
          "prunedSimilarIndexes": false,
          "winningPlan": {
            "isCached": false,
            "stage": "SUBPLAN",
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "transformBy": {
                "_id": 0,
                "remetente_id": 1,
                "destinatario_id": 1,
                "mensagem": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "SORT",
                "sortPattern": {
                  "data": -1,
                  "_id": -1
                },
                "memLimit": 33554432,
                "limitAmount": 5,
                "type": "simple",
                "inputStage": {
                  "stage": "FETCH",
                  "inputStage": {
                    "stage": "OR",
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[2, 2]"
                          ],
                          "destinatario_id": [
                            "[5, 5]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      },
                      {
                        "stage": "IXSCAN",
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[5, 5]"
                          ],
                          "destinatario_id": [
                            "[2, 2]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          "rejectedPlans": []
        },
        "executionStats": {
          "executionSuccess": true,
          "nReturned": 0,
          "executionTimeMillis": 0,
          "totalKeysExamined": 0,
          "totalDocsExamined": 0,
          "executionStages": {
            "isCached": false,
            "stage": "SUBPLAN",
            "nReturned": 0,
            "executionTimeMillisEstimate": 0,
            "works": 3,
            "advanced": 0,
            "needTime": 2,
            "needYield": 0,
            "saveState": 0,
            "restoreState": 0,
            "isEOF": 1,
            "inputStage": {
              "stage": "PROJECTION_SIMPLE",
              "nReturned": 0,
              "executionTimeMillisEstimate": 0,
              "works": 3,
              "advanced": 0,
              "needTime": 2,
              "needYield": 0,
              "saveState": 0,
              "restoreState": 0,
              "isEOF": 1,
              "transformBy": {
                "_id": 0,
                "remetente_id": 1,
                "destinatario_id": 1,
                "mensagem": 1,
                "data": 1
              },
              "inputStage": {
                "stage": "SORT",
                "nReturned": 0,
                "executionTimeMillisEstimate": 0,
                "works": 3,
                "advanced": 0,
                "needTime": 2,
                "needYield": 0,
                "saveState": 0,
                "restoreState": 0,
                "isEOF": 1,
                "sortPattern": {
                  "data": -1,
                  "_id": -1
                },
                "memLimit": 33554432,
                "limitAmount": 5,
                "type": "simple",
                "totalDataSizeSorted": 0,
                "usedDisk": false,
                "spills": 0,
                "spilledDataStorageSize": 0,
                "inputStage": {
                  "stage": "FETCH",
                  "nReturned": 0,
                  "executionTimeMillisEstimate": 0,
                  "works": 2,
                  "advanced": 0,
                  "needTime": 1,
                  "needYield": 0,
                  "saveState": 0,
                  "restoreState": 0,
                  "isEOF": 1,
                  "docsExamined": 0,
                  "alreadyHasObj": 0,
                  "inputStage": {
                    "stage": "OR",
                    "nReturned": 0,
                    "executionTimeMillisEstimate": 0,
                    "works": 2,
                    "advanced": 0,
                    "needTime": 1,
                    "needYield": 0,
                    "saveState": 0,
                    "restoreState": 0,
                    "isEOF": 1,
                    "dupsTested": 0,
                    "dupsDropped": 0,
                    "inputStages": [
                      {
                        "stage": "IXSCAN",
                        "nReturned": 0,
                        "executionTimeMillisEstimate": 0,
                        "works": 1,
                        "advanced": 0,
                        "needTime": 0,
                        "needYield": 0,
                        "saveState": 0,
                        "restoreState": 0,
                        "isEOF": 1,
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[2, 2]"
                          ],
                          "destinatario_id": [
                            "[5, 5]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        },
                        "keysExamined": 0,
                        "seeks": 1,
                        "dupsTested": 0,
                        "dupsDropped": 0
                      },
                      {
                        "stage": "IXSCAN",
                        "nReturned": 0,
                        "executionTimeMillisEstimate": 0,
                        "works": 1,
                        "advanced": 0,
                        "needTime": 0,
                        "needYield": 0,
                        "saveState": 0,
                        "restoreState": 0,
                        "isEOF": 1,
                        "keyPattern": {
                          "remetente_id": 1,
                          "destinatario_id": 1,
                          "data": -1
                        },
                        "indexName": "mensagens_participantes_data",
                        "isMultiKey": false,
                        "multiKeyPaths": {
                          "remetente_id": [],
                          "destinatario_id": [],
                          "data": []
                        },
                        "isUnique": false,
                        "isSparse": false,
                        "isPartial": false,
                        "indexVersion": 2,
                        "direction": "forward",
                        "indexBounds": {
                          "remetente_id": [
                            "[5, 5]"
                          ],
                          "destinatario_id": [
                            "[2, 2]"
                          ],
                          "data": [
                            "[MaxKey, MinKey]"
                          ]
                        },
                        "keysExamined": 0,
                        "seeks": 1,
                        "dupsTested": 0,
                        "dupsDropped": 0
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        "queryShapeHash": "A56532A34BD10345267C6ABB549C05DAB4E16E2F6C8ADDF47E0ECDF6519851EA",
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
          },
          "$db": "astro"
        },
        "serverParameters": {
          "internalQueryFacetBufferSizeBytes": 104857600,
          "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
          "internalLookupStageIntermediateDocumentMaxSizeBytes": 16793600,
          "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
          "internalQueryMaxBlockingSortMemoryUsageBytes": 33554432,
          "internalQueryProhibitBlockingMergeOnMongoS": 0,
          "internalQueryMaxAddToSetBytes": 104857600,
          "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
          "internalQueryFrameworkControl": "trySbeRestricted",
          "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
        },
        "ok": 1.0
      }
    }
  ]
};

# Validação da padronização Mongo e aparência de formulários

## Alterações

- API Java atualizada para origin/main, commit 04cc319. Estado anterior preservado em stash@{0}, na branch feat/SCRUM-672-reenviar-chave-acesso-colaborador. As alterações desta tarefa foram reaplicadas sobre main; não foi restaurado o restante do stash.
- Web envia appearance.icon/color em campo próprio; API valida, persiste configuracao.icone/cor e devolve a aparência em detalhes e listagens. Título permanece limpo e aceita 100 caracteres.
- Nomes físicos Mongo em português/snake_case; referências usam sufixo _id. Java/HTTP, SQL e protocolos externos mantêm seus contratos.
- Consumidores ajustados: astro-api, astro-web, astro-ai-api, astro-session-summary-service e astro-notification-service.
- Catálogo Mongo atualizado para nove coleções e snapshot generated/mongo.json regenerado. Dashboards não foram alterados.

## Verificações

| Parte | Resultado |
| --- | --- |
| Web | Build e lint concluídos; lint mantém avisos anteriores fora do escopo. 36 testes de formulários e interface passaram. A suíte ampla anterior teve 499 passes e uma falha no teste de aparência; essa falha foi corrigida e passou na repetição do módulo. |
| API completa | 704 testes encontrados: 644 passaram, 59 ignorados por dependências/condições locais e um erro no teste ChatPushConfigurationTest, causado pela falha de conexão de loopback do JDK no Windows. A repetição isolada manteve o mesmo erro ambiental. |
| Contratos novos da API | Três testes passaram: request/detail/summary, nomes BSON com ida e volta e validação de aparência inválida. |
| IA | 98 testes passaram na rodada de sessões, memória, ferramentas e ingestão; três erros foram de acesso ao diretório temporário do pytest. O módulo de ingestão e o novo teste de tradução foram repetidos em diretório isolado: 15 passaram. A verificação final de ferramentas e pseudonimização teve 35 passes. |
| Resumo | Verificação de tipos e 23 testes passaram. |
| Notificações | Verificação de tipos e 95 testes passaram; seis testes de integração ignorados por condições locais. |
| Catálogo Mongo | Oito testes de catálogo, edição e modelagem passaram; nove coleções, sem problemas de validação. |
| Migrador | Cinco testes passaram: preservação de respostas/IDs, tradução de aparência, conflitos, idempotência, mensagens/blocos e opções de índice. |
| Mongo remoto | Simulação final percorreu nove coleções sem conflito. Nenhuma escrita foi executada. Índices existentes e TTL da fila foram conferidos. |

## Publicação pendente

A migração de dados ainda não foi aplicada. A alteração troca nomes físicos compartilhados por serviços ativos. É necessário interromper os escritores e disponibilizar os consumidores compatíveis na mesma janela. O procedimento em docs/migracao-padronizacao.md exige backup antes da primeira escrita e descreve recuperação. Não basta publicar só o web ou só a API.

PRs preparados para SCRUM-389, conforme o código indicado pelo usuário. A preparação usa worktrees isoladas sobre a main remota de cada repositório, preservando o trabalho local anterior. Nenhum deploy nem migração remota foi executado.

# MongoDB do Astro

Catálogo dos documentos consumidos pelas APIs Java e de IA, pelos serviços de resumo e notificações. A estrutura foi confrontada com os nomes de campos do Mongo configurado na API e com os consumidores locais; a documentação descreve o esquema de destino. A migração de dados ainda precisa de uma janela coordenada.

## Convenção

Coleções e campos físicos usam português e `snake_case`. Referências usam `<entidade>_id` e listas usam `<entidade>_ids`. Exemplos: `workspace_id`, `gestor_remetente_id`, `usuario_id`, `conversa_id` e `participantes_ids`. `_id`, `_class`, operadores BSON e `$date` são metadados técnicos. Não traduzir IDs nem o conteúdo escrito pelo usuário.

Nomes dos arquivos `collections/*.json` correspondem às coleções. As chaves `name`, `fields`, `example` etc. são o formato do catálogo de documentação, não campos Mongo. Contratos HTTP, classes Java, identificadores de ícones/cores e protocolos externos continuam compatíveis; os mappers traduzem a persistência.

## Coleções

| Coleção de destino | Finalidade |
| --- | --- |
| configuracoes_paineis | Configurações pessoais de painéis, incluindo estilo, filtros e gráficos |
| formularios | Uma coleção compartilhada, documento por formulário, com perguntas, respostas e configuracao embutidas |
| conversas | Participantes do chat |
| mensagens | Mensagens vinculadas a conversas ou a remetente/destinatário explícitos |
| notificacoes | Alertas persistidos por usuário |
| sessoes | Histórico do chatbot, reservas e resumos |
| nrs | Catálogo publicado de NRs |
| nrs_pendentes | NRs em revisão |
| sincronizacoes_catalogo_nrs | Tarefas de sincronização SQL |
| fila_entregas_chat | Fila de entrega push da API Java |

Os exemplos são fictícios e usam JSON estendido para BSON date. A API recebe `dueDate` como YYYY-MM-DD e salva `data_limite` em BSON date. Os JSONs detalham tipos, campos opcionais, exemplos e índices observados/recomendados; índices recomendados não são apresentados como já criados.

## Formulários e aparência

O web envia `appearance: { icon, color }`; a API salva `configuracao: { icone, cor }` e devolve `appearance` no detalhe e na lista. O título permanece texto limpo, até 100 caracteres. A edição sem appearance preserva a configuração. A alteração continua bloqueada após respostas, segundo as regras existentes.

O marcador legado `[ac1:f:i:c]` é convertido pela migração, usando as posições históricas dos catálogos. Marcadores desconhecidos e valores divergentes interrompem a preparação, sem descartar informação. A migração não modifica as configurações locais dos dashboards.

## Migração e publicação

Consulte [o procedimento e as limitações](docs/migracao-padronizacao.md). `migrations/padronizar_documentos.py` inicia em simulação e não carrega variáveis em logs. Requer Python e pymongo. O modo de escrita exige backup vazio e declaração explícita de que os escritores estão interrompidos.

Após editar o catálogo, execute `node --input-type=module -e "import { analyzeMongo } from './analyzer/mongo/index.js'; await analyzeMongo();"`. O snapshot `generated/mongo.json` é usado pelo site. Os scripts SQL, Redis e Neo4j são independentes desta alteração.

## Painéis

A astro-dashboard-api salva configurações na coleção `configuracoes_paineis`, com campos portugueses e referências `usuario_id` e `workspace_id`. A configuração é pessoal dentro do workspace. O web importa as visões locais uma vez, conserva a cópia antiga e passa a ler e gravar via API. O estilo fica em `estilo`, separado do nome. O Worker exige os secrets MONGODB_URI e MONGODB_DATABASE antes da publicação. Dados analíticos permanecem no Databricks.

## Exportação do diagrama

O seletor **Disposição** oferece **Compacta** (padrão) e **Espaçada**. A disposição compacta organiza grupos independentes em colunas, reduz os intervalos e mostra cada campo uma única vez no documento mais específico já representado. Os campos usam nomes relativos ao documento e os caminhos completos permanecem no cabeçalho dos blocos. Nenhuma coleção, campo ou relação é removida. A escolha vale para a tela, o modo captura, o PNG, o SVG e as páginas; na disposição compacta, a posição dos blocos é automática.

Em **MongoDB → Modelagem**, use **Exportar PNG** ou **Exportar SVG**. A imagem única inclui todo o grafo, com nomes completos, tipos, relações, título e legenda. A exportação reorganiza os blocos para acomodar os textos, sem alterar os dados ou as relações; busca, seleção, posições arrastadas, zoom e rolagem não limitam o arquivo. O SVG inclui as cores e propriedades tipográficas, com larguras de texto explícitas para conservar o alinhamento em outros visualizadores. O PNG é renderizado em resolução 2×.

Escolha **Páginas numeradas (ZIP)** para baixar um pacote no formato selecionado. As divisões ocorrem nos espaços entre grupos conectados, mantendo cada entidade e suas relações inteiras. Grupos maiores que a altura de referência de 1800 unidades produzem páginas maiores. Todas as páginas incluem numeração e legenda. Se o PNG ultrapassar os limites de dimensão ou memória previstos para o navegador, a interface informa o problema e orienta usar SVG ou páginas, sem reduzir silenciosamente a qualidade.

O **Modo captura** mostra o modelo completo em fundo claro, sem menu lateral, cabeçalho de navegação e controles de modelagem. Use **Esc** ou **Voltar** para retornar à página.

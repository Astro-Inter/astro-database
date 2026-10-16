# Documentação MongoDB

Este módulo documenta propostas de modelagem e estruturas observadas nas referências fornecidas. Não executa comandos MongoDB nem substitui a aprovação das regras de negócio.

- `collections/*.json`: uma definição por collection ou modelo, com nome, finalidade, campos, exemplo, observações e índices documentados.
- `docs/modeling.json`: princípios e decisões pendentes.
- `analyzer/mongo/`: leitura e validação do catálogo, independente do parser SQL.
- `site/components/mongo/`: interface da área MongoDB.

Os arquivos JSON são a fonte da documentação. Nos exemplos, datas BSON usam `$date`; datas sem horário, como `forms.data_limite`, usam strings `YYYY-MM-DD`. A modelagem de formulários registra a proposta de uma collection por formulário, sem decidir por uma única collection física. Notificações continuam com destino MongoDB/Redis em aberto. Tipos, obrigatoriedade e índices ainda precisam de validação.

O modelo `forms` inclui workspace, gestores remetente e destinatário, NR, unidade, prazo, status e datas de criação e resposta. O exemplo de inspeção de segurança contém perguntas dos tipos `alternativa`, `texto`, `foto` e `data`, com respostas inicialmente vazias em `perguntas[].resposta`. Alternativas possuem opções identificadas (`id_opcao`, `texto` e `outra`) e configuração de múltipla escolha; fotos possuem limites de quantidade e tamanho de arquivos. O formato das respostas preenchidas e os status além de `PENDENTE` ainda precisam ser definidos.

A collection `sessoes` documenta a estrutura do chatbot exibida no MongoDB Compass: identificadores textuais de sessão e usuário, ação pendente, datas BSON, mensagens com `role` e `content`, resumo, indicador de indexação, status e última rota. O exemplo usa `human` e `assistant`, status `ativa`, rota `direta` e `acao_pendente` nula. Os identificadores do exemplo são fictícios. A estrutura de ações preenchidas e as definições dos cinco índices indicados na referência ainda precisam ser documentadas.

A collection `mensagens` documenta o chat com os campos `_id`, `id_envia`, `id_recebe`, `mensagem` e `data`. A referência mostra `_id` como string em formato UUID ou como ObjectId, remetente e destinatário numéricos, texto e data BSON. Cada documento representa uma mensagem. As definições dos três índices indicados na referência e o registro de leitura ainda precisam ser documentados.

O modelo `notificacoes` contém `_id`, `id_usuario`, `mensagem`, `data_criacao`, `idevento` e `titulo`. O campo `idevento`, sem sublinhado, é opcional e pode ser omitido quando não houver evento associado; `titulo` descreve o alerta, separado da mensagem. O exemplo alerta sobre o prazo de um evento próximo do fim, com data BSON representada por `$date`.

No modo local, use **Editar documentação** na collection ou na aba de decisões. Revise as alterações e salve para atualizar o arquivo JSON e o catálogo. Para editar os arquivos diretamente, altere os JSONs e execute `npm run analyze` ou `npm run build`. O snapshot `generated/mongo.json` atende tanto ao modo local quanto ao site estático. PostgreSQL continua em `database/`; seus scripts, métricas, execução e histórico permanecem separados do catálogo MongoDB.

Uma nova definição deve conter `name`, `title`, `description`, `status`, `pattern`, `fields`, `example`, `notes` e `indexes`. Cada campo usa `name`, `type`, `description` e `required` (`Sim`, `Não` ou `A definir`). Não coloque credenciais ou dados reais nos exemplos.

A aba **Modelagem** mostra collections e documentos embutidos, com busca, zoom e arraste dos cards. Caminhos como `mensagens[].role` detalham um documento embutido no campo `mensagens` de tipo `array<object>`. Para documentar uma referência entre collections, acrescente `references` ao campo com o nome da collection de destino, por exemplo `"references": "nrs"`. IDs sem essa declaração não geram ligações. As posições arrastadas são temporárias durante a navegação; os arquivos JSON definem a estrutura do diagrama.

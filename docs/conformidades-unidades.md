# Conformidades de unidades — SCRUM-657

A instalação do banco vazio inclui `conformidade.tipo` (COLABORADOR ou UNIDADE), `unidade_id` e `formulario_resposta_id`. A constraint exige exatamente um destinatário, coerente com o tipo. Registros de colaboradores continuam com o tipo padrão COLABORADOR, inclusive os inseridos por eventos e cargas existentes.

A origem FORMULARIO exige tipo UNIDADE, referência não vazia ao formulário e ausência de conclusão de evento. A referência MongoDB é validada pela API e tem unicidade no PostgreSQL. MANUAL pode pertencer a colaborador ou unidade. Não há unicidade por unidade/NR, pois aprovações distintas precisam preservar seu histórico.

`vw_conformidade_colaborador` mantém o contrato de colaboradores. `vw_conformidade_unidade` escolhe um representante por unidade/NR: aplicável, maior validade com nulos por último, depois maior ID. O índice parcial atende unidades. As views não substituem a autorização da API por workspace e unidades permitidas.

Ao aprovar um formulário com NR, a API cria histórico para a unidade indicada no formulário; sem ela, usa a unidade do destinatário consultada na aprovação. A validade soma os meses de reciclagem à data da resposta em America/Sao_Paulo. Formulários reprovados ou sem NR não geram conformidade. Repetir a aprovação reconcilia falhas entre bancos, sem duplicar a conformidade.

Os arquivos foram ajustados para instalação do zero. Esta tarefa não executa nem fornece migração do banco atual. A migração será preparada depois da aprovação do protótipo. O ambiente local usa exclusivamente astro657 em 127.0.0.1:54657 e dados fictícios.

## Indicadores da Home

A view vw_home_estatisticas_gerais soma as conformidades de colaboradores já consideradas anteriormente aos requisitos das unidades ativas. Cada unidade/NR vigente de unidade_nr entra uma vez; sem registro de conformidade, fica pendente. Conformidades de unidade aplicáveis registradas fora de unidade_nr também entram. Histórico exclusivamente não aplicável exclui o par; com algum aplicável, usa a maior validade aplicável. Unidades inativas e NRs revogadas não entram. As categorias e o cálculo percentual preservam as regras anteriores. Esta alteração não infere requisitos de cargo_nr para colaboradores.

Validação: test/sql/home_conformidades_unidades.sql e test/sql/gestores_como_colaboradores.sql passaram no astro657 local, com schemas isolados e ROLLBACK. A view foi aplicada somente nesse banco; o endpoint local /home/workspace confirmou os valores. Nenhuma alteração foi aplicada ao banco atual publicado.


## Carga inicial

`database/dataload/14_conformidade.sql` declara COLABORADOR nas cargas existentes e cria pendências MANUAIS para cada unidade ativa e NR vigente de unidade_nr, sem validade ou evidência fictícia de formulário. A repetição não duplica esses pares. A regressão está em `test/sql/dataload_conformidades.sql`, executada em schema isolado com ROLLBACK.

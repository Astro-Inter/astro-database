CREATE OR REPLACE VIEW vw_home_estatisticas_gerais AS
WITH unidades_ativas AS (
    SELECT id_unidade, workspace_id
    FROM unidade
    WHERE ativo = TRUE
), colaboradores_ativos AS (
    SELECT u.id_usuario, un.workspace_id
    FROM usuario u
    INNER JOIN unidades_ativas un ON un.id_unidade = u.unidade_id
    WHERE u.tipo IN ('COLABORADOR', 'GESTOR', 'GESTOR_WORKSPACE')
      AND u.status = 'ATIVO'
), conformidades_atuais AS (
    SELECT ca.workspace_id, ca.id_usuario, c.nr_id,
           MAX(c.data_validade) AS data_validade
    FROM colaboradores_ativos ca
    INNER JOIN conformidade c ON c.usuario_id = ca.id_usuario
    INNER JOIN nr_catalogo nr ON nr.codigo_nr = c.nr_id
    WHERE c.aplicavel = TRUE
      AND nr.revogada = FALSE
    GROUP BY ca.workspace_id, ca.id_usuario, c.nr_id
), historico_unidades AS (
    SELECT ua.workspace_id, ua.id_unidade, c.nr_id,
           BOOL_OR(c.aplicavel) AS aplicavel,
           MAX(c.data_validade) FILTER (WHERE c.aplicavel) AS data_validade
    FROM unidades_ativas ua
    INNER JOIN conformidade c ON c.unidade_id = ua.id_unidade AND c.tipo = 'UNIDADE'
    INNER JOIN nr_catalogo nr ON nr.codigo_nr = c.nr_id AND nr.revogada = FALSE
    GROUP BY ua.workspace_id, ua.id_unidade, c.nr_id
), requisitos_unidades AS (
    SELECT ua.workspace_id, ua.id_unidade, unr.nr_id
    FROM unidades_ativas ua
    INNER JOIN unidade_nr unr ON unr.unidade_id = ua.id_unidade
    INNER JOIN nr_catalogo nr ON nr.codigo_nr = unr.nr_id AND nr.revogada = FALSE
    UNION
    SELECT workspace_id, id_unidade, nr_id
    FROM historico_unidades
    WHERE aplicavel = TRUE
), conformidades_unidades AS (
    SELECT ru.workspace_id, h.data_validade
    FROM requisitos_unidades ru
    LEFT JOIN historico_unidades h
        ON h.id_unidade = ru.id_unidade AND h.nr_id = ru.nr_id
    WHERE h.aplicavel IS DISTINCT FROM FALSE
), conformidades_avaliadas AS (
    SELECT workspace_id, data_validade FROM conformidades_atuais
    UNION ALL
    SELECT workspace_id, data_validade FROM conformidades_unidades
), resumo_conformidade AS (
    SELECT workspace_id,
           COUNT(*) AS quantidade_requisitos,
           COUNT(*) FILTER (
               WHERE data_validade > CURRENT_DATE + 30
           ) AS quantidade_conformes,
           COUNT(*) FILTER (
               WHERE data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
           ) AS quantidade_proximos_vencimento,
           COUNT(*) FILTER (
               WHERE data_validade < CURRENT_DATE
           ) AS quantidade_vencidos,
           COUNT(*) FILTER (
               WHERE data_validade IS NULL
           ) AS quantidade_pendentes
    FROM conformidades_avaliadas
    GROUP BY workspace_id
), resumo_unidades AS (
    SELECT workspace_id, COUNT(*) AS quantidade_unidades
    FROM unidades_ativas
    GROUP BY workspace_id
), resumo_colaboradores AS (
    SELECT workspace_id, COUNT(*) AS quantidade_colaboradores
    FROM colaboradores_ativos
    GROUP BY workspace_id
)
SELECT w.id_workspace,
       COALESCE(ru.quantidade_unidades, 0) AS quantidade_unidades,
       COALESCE(rc.quantidade_colaboradores, 0) AS quantidade_colaboradores,
       COALESCE(r.quantidade_requisitos, 0) AS quantidade_requisitos,
       COALESCE(r.quantidade_conformes, 0) AS quantidade_conformes,
       COALESCE(r.quantidade_proximos_vencimento, 0) AS quantidade_proximos_vencimento,
       COALESCE(r.quantidade_vencidos, 0) AS quantidade_vencidos,
       COALESCE(r.quantidade_pendentes, 0) AS quantidade_pendentes,
       COALESCE(ROUND(
           100.0 * (r.quantidade_conformes + r.quantidade_proximos_vencimento)
           / NULLIF(r.quantidade_requisitos, 0), 2
       ), 0.00) AS percentual_conformidade_geral,
       CURRENT_DATE AS data_referencia
FROM workspace w
LEFT JOIN resumo_unidades ru ON ru.workspace_id = w.id_workspace
LEFT JOIN resumo_colaboradores rc ON rc.workspace_id = w.id_workspace
LEFT JOIN resumo_conformidade r ON r.workspace_id = w.id_workspace;

COMMENT ON VIEW vw_home_estatisticas_gerais IS
'SCRUM-490 / SCRUM-657: estatísticas da Home WEB por workspace, incluindo workspaces sem dados com valores zero. Conta unidades ativas e usuários ATIVOS dos tipos COLABORADOR, GESTOR e GESTOR_WORKSPACE dessas unidades, contados uma vez por usuário. Para colaboradores, preserva a avaliação das conformidades registradas como aplicáveis de NRs não revogadas, uma por colaborador/NR, usando a maior validade, sem inferir requisitos de cargo_nr. Para unidades ativas, inclui cada unidade/NR vigente de unidade_nr e também conformidades de unidade aplicáveis já registradas, sem duplicar o par. Requisitos de unidade sem registro são pendentes. Histórico exclusivamente não aplicável exclui o par; havendo aplicável, usa a maior validade aplicável. Requisitos de pessoas e de unidades têm o mesmo peso. Categorias exclusivas: conformes (mais de 30 dias), próximos do vencimento (hoje até 30 dias, inclusive), vencidos (antes de hoje) e pendentes (sem validade). Conformidade geral é a porcentagem de requisitos com validade vigente, incluindo próximos do vencimento, sobre todos os requisitos avaliados, incluindo pendentes. Sem requisitos, retorna 0.00. Datas seguem o fuso da sessão PostgreSQL.';
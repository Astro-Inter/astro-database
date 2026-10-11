CREATE OR REPLACE VIEW vw_home_estatisticas_gerais AS
WITH unidades_ativas AS (
    SELECT id_unidade, workspace_id
    FROM unidade
    WHERE ativo = TRUE
), colaboradores_ativos AS (
    SELECT u.id_usuario, un.workspace_id
    FROM usuario u
    INNER JOIN unidades_ativas un ON un.id_unidade = u.unidade_id
    WHERE u.tipo = 'COLABORADOR'
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
    FROM conformidades_atuais
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
'SCRUM-490: estatísticas da Home WEB por workspace, incluindo workspaces sem dados com valores zero. Conta unidades ativas e colaboradores ATIVOS dessas unidades. Avalia somente conformidades registradas como aplicáveis de NRs não revogadas, uma por colaborador/NR, usando a maior validade. Não infere requisitos ausentes a partir de cargo_nr ou unidade_nr. Categorias exclusivas: conformes (mais de 30 dias), próximos do vencimento (hoje até 30 dias, inclusive), vencidos (antes de hoje) e pendentes (sem validade). Conformidade geral é a porcentagem de requisitos com validade vigente, incluindo próximos do vencimento, sobre todos os requisitos avaliados, incluindo pendentes. Sem requisitos, retorna 0.00. Datas seguem o fuso da sessão PostgreSQL.';
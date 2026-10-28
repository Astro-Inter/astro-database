CREATE OR REPLACE VIEW vw_conformidade_unidade AS
SELECT cf.id_conformidade, cf.tipo, cf.unidade_id, un.nome AS nome_unidade,
       un.workspace_id, cf.nr_id, nr.titulo AS titulo_nr, cf.aplicavel,
       cf.data_validade, cf.origem, cf.formulario_resposta_id,
       CASE WHEN cf.data_validade IS NULL THEN 'Sem validade'
            WHEN cf.data_validade < CURRENT_DATE THEN 'Vencida' ELSE 'Válida' END AS status
FROM (
    SELECT c.*, ROW_NUMBER() OVER (
        PARTITION BY c.unidade_id, c.nr_id
        ORDER BY c.aplicavel DESC, c.data_validade DESC NULLS LAST, c.id_conformidade DESC
    ) AS ordem
    FROM conformidade c WHERE c.tipo = 'UNIDADE'
) cf
JOIN unidade un ON un.id_unidade = cf.unidade_id
JOIN nr_catalogo nr ON nr.codigo_nr = cf.nr_id
WHERE cf.ordem = 1;

COMMENT ON VIEW vw_conformidade_unidade IS 'Um representante por unidade/NR, incluindo histórico de unidades inativas. Prioriza aplicáveis, maior validade e maior ID, preservando a evidência do registro. A API restringe workspace e unidades autorizadas.';

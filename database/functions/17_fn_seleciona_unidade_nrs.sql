CREATE OR REPLACE FUNCTION fn_seleciona_unidade_nrs(
    p_firebase_uid TEXT,
    p_id_unidade BIGINT
)
RETURNS TABLE (
    codigo_nr INTEGER,
    descricao VARCHAR(255)
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        nr.codigo_nr,
        nr.titulo AS descricao
    FROM usuario solicitante
    INNER JOIN unidade unidade_gestor
        ON unidade_gestor.id_unidade = solicitante.unidade_id
    INNER JOIN unidade un
        ON un.workspace_id = unidade_gestor.workspace_id
       AND un.id_unidade = p_id_unidade
    INNER JOIN unidade_nr un_nr
        ON un_nr.unidade_id = un.id_unidade
    INNER JOIN nr_catalogo nr
        ON nr.codigo_nr = un_nr.nr_id
    WHERE NULLIF(BTRIM(p_firebase_uid), '') IS NOT NULL
      AND p_id_unidade IS NOT NULL
      AND solicitante.firebase_uid = p_firebase_uid
      AND solicitante.tipo IN ('GESTOR', 'GESTOR_WORKSPACE')
      AND solicitante.status = 'ATIVO'
    ORDER BY nr.codigo_nr;
$$;

COMMENT ON FUNCTION fn_seleciona_unidade_nrs(TEXT, BIGINT) IS
'Retorna o código numérico e a descrição das NRs associadas à unidade informada quando o Firebase UID pertence a um gestor ativo do mesmo workspace. Retorna zero linhas para UID ou unidade sem acesso e para unidades sem NRs associadas.';

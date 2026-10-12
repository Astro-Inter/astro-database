CREATE OR REPLACE FUNCTION fn_altera_status_unidade(
    p_firebase_uid TEXT,
    p_id_unidade BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_workspace_id BIGINT;
    v_ativo BOOLEAN;
BEGIN
    IF NULLIF(BTRIM(p_firebase_uid), '') IS NULL OR p_id_unidade IS NULL THEN
        RAISE EXCEPTION 'Informe um Firebase UID e um ID de unidade válidos.'
            USING ERRCODE = '22023';
    END IF;

    SELECT unidade_gestor.workspace_id
    INTO v_workspace_id
    FROM usuario solicitante
    INNER JOIN unidade unidade_gestor
        ON unidade_gestor.id_unidade = solicitante.unidade_id
    WHERE solicitante.firebase_uid = p_firebase_uid
      AND solicitante.tipo IN ('GESTOR', 'GESTOR_WORKSPACE')
      AND solicitante.status = 'ATIVO';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gestor ativo não encontrado para o Firebase UID informado.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE unidade
    SET ativo = NOT COALESCE(ativo, FALSE)
    WHERE id_unidade = p_id_unidade
      AND workspace_id = v_workspace_id
    RETURNING ativo INTO v_ativo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unidade não encontrada no workspace do gestor.'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN v_ativo;
END;
$$;

COMMENT ON FUNCTION fn_altera_status_unidade(TEXT, BIGINT) IS
'Alterna o status da unidade quando o Firebase UID pertence a um gestor ativo do mesmo workspace. Retorna TRUE quando fica ativa e FALSE quando fica inativa. Ao desativar, o trigger existente executa as regras de desativação dos usuários vinculados.';

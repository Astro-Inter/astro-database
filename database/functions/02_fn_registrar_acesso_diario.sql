CREATE OR REPLACE FUNCTION fn_registrar_acesso_diario(
    p_firebase_uid VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_firebase_uid IS NULL OR btrim(p_firebase_uid) = '' OR length(p_firebase_uid) > 128 THEN
        RAISE EXCEPTION 'Firebase UID deve conter entre 1 e 128 caracteres.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO acesso (
        data,
        firebase_uid
    )
    VALUES (
        CURRENT_DATE,
        p_firebase_uid
    )
    ON CONFLICT (data, firebase_uid)
    DO NOTHING;
END;
$$;

COMMENT ON FUNCTION fn_registrar_acesso_diario(VARCHAR) IS
'Registra o Firebase UID autenticado no CURRENT_DATE da sessão PostgreSQL. Repetições no mesmo dia não alteram os dados. A aplicação valida a identidade antes da chamada; a função não autentica nem consulta o perfil.';

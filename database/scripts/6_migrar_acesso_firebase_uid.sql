DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'acesso' AND column_name = 'usuario_id'
    ) THEN
        LOCK TABLE acesso IN ACCESS EXCLUSIVE MODE;

        IF EXISTS (
            SELECT 1 FROM acesso a
            LEFT JOIN usuario u ON u.id_usuario = a.usuario_id
            WHERE u.firebase_uid IS NULL OR btrim(u.firebase_uid) = '' OR length(u.firebase_uid) > 128
        ) THEN
            RAISE EXCEPTION 'Existem acessos sem Firebase UID válido. Corrija os vínculos antes da migração.';
        END IF;

        ALTER TABLE acesso ADD COLUMN firebase_uid VARCHAR(128);
        UPDATE acesso a SET firebase_uid = u.firebase_uid
        FROM usuario u WHERE u.id_usuario = a.usuario_id;

        ALTER TABLE acesso DROP CONSTRAINT pk_acesso;
        ALTER TABLE acesso DROP COLUMN usuario_id;
        ALTER TABLE acesso ALTER COLUMN firebase_uid SET NOT NULL;
        ALTER TABLE acesso ADD CONSTRAINT pk_acesso PRIMARY KEY (data, firebase_uid);
    END IF;

    DROP FUNCTION IF EXISTS fn_registrar_acesso_diario(BIGINT);
END;
$$;

COMMENT ON COLUMN acesso.firebase_uid IS
'UID validado pelo Firebase da identidade autenticada, incluindo usuários e administradores. Um registro por identidade e dia.';

BEGIN;
CREATE SCHEMA teste_acesso_diario;
SET LOCAL search_path TO teste_acesso_diario;

CREATE TABLE usuario (id_usuario BIGINT PRIMARY KEY, firebase_uid VARCHAR(128));
CREATE TABLE acesso (data DATE NOT NULL, usuario_id INTEGER NOT NULL, CONSTRAINT pk_acesso PRIMARY KEY (data, usuario_id));
INSERT INTO usuario VALUES (1, 'uid-historico');
INSERT INTO acesso VALUES (CURRENT_DATE - 1, 1);

CREATE FUNCTION fn_registrar_acesso_diario(p_usuario_id BIGINT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO acesso VALUES (CURRENT_DATE, p_usuario_id)
    ON CONFLICT (data, usuario_id) DO NOTHING;
END;
$$;

\ir ../../database/scripts/6_migrar_acesso_firebase_uid.sql
\ir ../../database/functions/02_fn_registrar_acesso_diario.sql
\ir ../../database/scripts/6_migrar_acesso_firebase_uid.sql
\ir ../../database/functions/02_fn_registrar_acesso_diario.sql

DO $$
DECLARE
    v_uid TEXT;
BEGIN
    ASSERT (SELECT count(*) FROM acesso WHERE firebase_uid = 'uid-historico' AND data = CURRENT_DATE - 1) = 1;
    ASSERT to_regprocedure('fn_registrar_acesso_diario(bigint)') IS NULL;

    PERFORM fn_registrar_acesso_diario('uid-historico');
    PERFORM fn_registrar_acesso_diario('uid-historico');
    PERFORM fn_registrar_acesso_diario('uid-admin');
    PERFORM fn_registrar_acesso_diario('UID-admin');
    PERFORM fn_registrar_acesso_diario(repeat('x', 128)::VARCHAR);
    ASSERT (SELECT count(*) FROM acesso) = 5;
    ASSERT (SELECT count(*) FROM acesso WHERE data = CURRENT_DATE) = 4;
    ASSERT (SELECT count(*) FROM acesso WHERE firebase_uid = 'uid-historico') = 2;

    FOREACH v_uid IN ARRAY ARRAY[NULL, '', '   ', repeat('x', 129)] LOOP
        BEGIN
            PERFORM fn_registrar_acesso_diario(v_uid::VARCHAR);
            RAISE EXCEPTION 'UID inválido foi aceito';
        EXCEPTION WHEN invalid_parameter_value THEN
            NULL;
        END;
    END LOOP;
END;
$$;
ROLLBACK;

-- Aplicar antes das definições atualizadas das funções de Home.
-- ALTER preserva OID, permissões e dependências; não remove objetos com CASCADE.
DO $$
DECLARE
    v_nome TEXT;
    v_antiga REGPROCEDURE;
    v_nova REGPROCEDURE;
BEGIN
    FOREACH v_nome IN ARRAY ARRAY['carrega_home_colaborador', 'carrega_home_gestor'] LOOP
        v_antiga := TO_REGPROCEDURE(FORMAT('%I.%I(text)', CURRENT_SCHEMA(), v_nome));
        v_nova := TO_REGPROCEDURE(FORMAT('%I.%I(text)', CURRENT_SCHEMA(), 'fn_' || v_nome));
        IF v_antiga IS NOT NULL AND v_nova IS NOT NULL THEN
            RAISE EXCEPTION 'Existem % e fn_% no schema %. Revisar antes de migrar.',
                v_nome, v_nome, CURRENT_SCHEMA();
        ELSIF v_antiga IS NOT NULL THEN
            EXECUTE FORMAT('ALTER FUNCTION %I.%I(TEXT) RENAME TO %I',
                CURRENT_SCHEMA(), v_nome, 'fn_' || v_nome);
        END IF;
    END LOOP;
END;
$$;

\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE evento (
    id_evento INTEGER PRIMARY KEY,
    modo_conclusao VARCHAR(50) NOT NULL,
    CONSTRAINT ck_evento_modo_conclusao CHECK (
        modo_conclusao IN ('COLABORADOR', 'GESTOR', 'LISTA_PRESENCA')
    )
);

INSERT INTO evento VALUES
    (1, 'COLABORADOR'),
    (2, 'GESTOR'),
    (3, 'LISTA_PRESENCA'),
    (4, 'LISTA_PRESENCA');

\ir ../../database/scripts/4_normalizar_modo_conclusao_evento.sql
-- Reaplicar a atualização não deve alterar os resultados nem duplicar a constraint.
\ir ../../database/scripts/4_normalizar_modo_conclusao_evento.sql

DO $$
DECLARE
    valor_invalido TEXT;
BEGIN
    ASSERT (SELECT COUNT(*) = 4 FROM evento);
    ASSERT (SELECT modo_conclusao = 'COLABORADOR' FROM evento WHERE id_evento = 1);
    ASSERT (SELECT BOOL_AND(modo_conclusao = 'GESTOR') FROM evento WHERE id_evento IN (2, 3, 4));

    INSERT INTO evento VALUES (5, 'COLABORADOR'), (6, 'GESTOR');

    FOREACH valor_invalido IN ARRAY ARRAY['LISTA_PRESENCA', 'LISTA_PRESENÇA', 'OUTRO', 'gestor'] LOOP
        BEGIN
            INSERT INTO evento VALUES (7, valor_invalido);
            RAISE EXCEPTION 'Modo inválido aceito: %', valor_invalido;
        EXCEPTION WHEN check_violation THEN
            NULL;
        END;
    END LOOP;

    BEGIN
        INSERT INTO evento VALUES (8, NULL);
        RAISE EXCEPTION 'Modo nulo aceito';
    EXCEPTION WHEN not_null_violation THEN
        NULL;
    END;

    ASSERT (SELECT COUNT(*) = 6 FROM evento);
END;
$$;

ROLLBACK;

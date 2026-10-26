-- Executar com psql em banco de teste. Schema isolado, dados desfeitos ao final.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_scrum_635;
SET LOCAL search_path = teste_scrum_635;
\ir ../../database/scripts/1_create_table.sql
\ir ../../database/scripts/2_constraints.sql

-- Instalação nova e reaplicação, incluindo migração sem funções antigas.
\ir ../../database/scripts/6_prefixar_funcoes_home.sql
\ir ../../database/functions/08_fn_carrega_home_colaborador.sql
\ir ../../database/functions/09_fn_carrega_home_gestor.sql
CREATE TEMP TABLE funcoes_originais AS
SELECT oid, proname, proacl FROM pg_proc
WHERE pronamespace = 'teste_scrum_635'::REGNAMESPACE;
REVOKE EXECUTE ON FUNCTION fn_carrega_home_colaborador(TEXT) FROM PUBLIC;
ALTER FUNCTION fn_carrega_home_colaborador(TEXT) RENAME TO carrega_home_colaborador;
ALTER FUNCTION fn_carrega_home_gestor(TEXT) RENAME TO carrega_home_gestor;
CREATE VIEW dependencia_home AS SELECT carrega_home_colaborador('inexistente') AS home;
\ir ../../database/scripts/6_prefixar_funcoes_home.sql
\ir ../../database/scripts/6_prefixar_funcoes_home.sql
\ir ../../database/functions/08_fn_carrega_home_colaborador.sql
\ir ../../database/functions/09_fn_carrega_home_gestor.sql
\ir ../../database/views/04_vw_home_estatisticas_gerais.sql
\ir ../../database/views/04_vw_unidades.sql
\ir ../../database/views/07_vw_conformidades.sql

INSERT INTO workspace (id_workspace, nome, cnpj) VALUES
    (1, 'Workspace teste', '99999999999635'), (2, 'Outro workspace', '99999999999636'),
    (3, 'Workspace vazio', '99999999999637');
INSERT INTO unidade (id_unidade, workspace_id, nome, ativo) VALUES
    (1, 1, 'Principal', TRUE), (2, 1, 'Outra unidade', TRUE),
    (3, 1, 'Inativa', FALSE), (4, 2, 'Outro workspace', TRUE), (5, 1, 'Vazia', TRUE);
INSERT INTO cargo (id_cargo, workspace_id, nome) VALUES (1, 1, 'Cargo teste'), (2, 2, 'Outro cargo');
INSERT INTO usuario (id_usuario, nome, email, firebase_uid, tipo, cargo_id, unidade_id, status)
SELECT id, 'Pessoa ' || id, 'pessoa' || id || '@example.com', 'uid-' || id,
       tipo, CASE WHEN unidade = 4 THEN 2 ELSE 1 END, unidade, status
FROM (VALUES
    (1, 'COLABORADOR', 1, 'ATIVO'), (2, 'GESTOR', 1, 'ATIVO'),
    (3, 'GESTOR_WORKSPACE', 1, 'ATIVO'), (4, 'GESTOR', 1, 'DESATIVADO'),
    (5, 'GESTOR_WORKSPACE', 2, 'ATIVO'), (6, 'GESTOR', 3, 'ATIVO'),
    (7, 'GESTOR_WORKSPACE', 4, 'ATIVO'), (8, 'COLABORADOR', 1, 'PRE_CADASTRADO'),
    (9, 'GESTOR_WORKSPACE', 1, 'DESATIVADO'), (10, 'COLABORADOR', 1, 'DESATIVADO')
) AS dados(id, tipo, unidade, status);
INSERT INTO admin (nome, email, firebase_uid) VALUES ('Admin teste', 'admin@example.com', 'uid-admin');
INSERT INTO nr_catalogo (codigo_nr, titulo, tempo_reciclagem_mes, revogada) VALUES
    (1, 'NR teste', 12, FALSE), (2, 'NR revogada', 12, TRUE), (3, 'Outra NR', 12, FALSE);
INSERT INTO evento (id_evento, gestor_id, nr_id, titulo, descricao, modo_conclusao, status) VALUES
    (1, 2, 1, 'Atual', 'Evento atual', 'GESTOR', 'ATIVO'),
    (2, 7, 1, 'Outro workspace', 'Evento externo', 'GESTOR', 'ATIVO'),
    (3, 2, 1, 'Cancelado', 'Evento cancelado', 'GESTOR', 'ATIVO'),
    (4, 2, 1, 'Encerrado', 'Evento encerrado', 'GESTOR', 'CONCLUIDO');
UPDATE evento SET status = 'CANCELADO', data_cancelamento = LOCALTIMESTAMP,
    motivo_cancelamento = 'Cancelamento de teste' WHERE id_evento = 3;
INSERT INTO turma (id_turma, evento_id, nome, data_inicial, data_termino) VALUES
    (1, 1, 'Atual', LOCALTIMESTAMP - INTERVAL '1 day', LOCALTIMESTAMP + INTERVAL '2 days'),
    (2, 1, 'Duplicada', LOCALTIMESTAMP - INTERVAL '1 day', LOCALTIMESTAMP + INTERVAL '2 days 1 hour'),
    (3, 2, 'Externa', LOCALTIMESTAMP - INTERVAL '1 day', LOCALTIMESTAMP + INTERVAL '2 days'),
    (4, 3, 'Cancelada', LOCALTIMESTAMP - INTERVAL '1 day', LOCALTIMESTAMP + INTERVAL '2 days'),
    (5, 4, 'Encerrada', LOCALTIMESTAMP - INTERVAL '3 days', LOCALTIMESTAMP - INTERVAL '1 day');
INSERT INTO turma_colaborador (id_turma_colaborador, turma_id, usuario_id) VALUES
    (1, 1, 1), (2, 1, 2), (3, 1, 3), (4, 1, 4), (5, 1, 7),
    (6, 2, 1), (7, 2, 2), (8, 2, 3), (9, 3, 3), (10, 4, 3), (11, 5, 3),
    (12, 1, 8), (13, 1, 9), (14, 1, 10);
INSERT INTO conclusao_evento (id_conclusao_evento, turma_colaborador_id, status, data_conclusao) 
SELECT id_turma_colaborador, id_turma_colaborador, 'PENDENTE', LOCALTIMESTAMP - INTERVAL '1 hour'
FROM turma_colaborador WHERE id_turma_colaborador IN (1, 2, 3, 4, 5, 12, 13, 14);
INSERT INTO conclusao_evento (id_conclusao_evento, turma_colaborador_id, status, data_conclusao, data_validacao)
VALUES (11, 11, 'CONCLUIDO', LOCALTIMESTAMP - INTERVAL '2 days', LOCALTIMESTAMP - INTERVAL '1 day');
INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem) VALUES
    (1, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (2, 1, TRUE, CURRENT_DATE + 10, 'MANUAL'),
    (2, 1, TRUE, CURRENT_DATE + 5, 'MANUAL'),
    (3, 1, TRUE, CURRENT_DATE - 1, 'MANUAL'),
    (5, 1, TRUE, NULL, 'MANUAL'),
    (6, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (7, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (4, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (8, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (9, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (10, 1, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (3, 2, TRUE, CURRENT_DATE + 40, 'MANUAL'),
    (3, 3, FALSE, CURRENT_DATE + 40, 'MANUAL');

DO $$
DECLARE
    v_id INTEGER;
    v_uid TEXT;
    v_home JSONB;
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1 FROM funcoes_originais f
        LEFT JOIN pg_proc p ON p.oid = f.oid AND p.proname = f.proname
        WHERE p.oid IS NULL
    ), 'Migração preserva OID e nomes finais';
    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_proc p, ACLEXPLODE(p.proacl) a
        WHERE p.oid = 'fn_carrega_home_colaborador(text)'::REGPROCEDURE
          AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
    ),
        'Migração preserva permissões';
    ASSERT (SELECT home IS NULL FROM dependencia_home), 'Dependência permanece válida';
    ASSERT TO_REGPROCEDURE('carrega_home_colaborador(text)') IS NULL;
    ASSERT TO_REGPROCEDURE('carrega_home_gestor(text)') IS NULL;
    FOREACH v_id IN ARRAY ARRAY[1, 2, 3] LOOP
        v_home := fn_carrega_home_colaborador('uid-' || v_id);
        ASSERT v_home IS NOT NULL;
        ASSERT v_home->>'workspace_name' = 'Workspace teste';
        ASSERT (v_home #>> '{events_metrics,pending}')::INTEGER = 1,
            'Cada evento pendente é contado uma vez';
    END LOOP;
    FOREACH v_uid IN ARRAY ARRAY[NULL, '', '   ', 'inexistente', 'uid-admin', 'uid-4', 'uid-8', 'uid-9', 'uid-10'] LOOP
        ASSERT fn_carrega_home_colaborador(v_uid) IS NULL, 'UID/perfil/status inelegível';
    END LOOP;
    v_home := fn_carrega_home_colaborador('uid-3');
    ASSERT (v_home #>> '{events_metrics,done}')::INTEGER = 1, 'Encerrado validado continua contado';
    ASSERT JSONB_ARRAY_LENGTH(v_home->'pending_events') = 1, 'Ignora cancelado e outro workspace';
    ASSERT v_home->>'status_message' = 'URGENT';
    FOREACH v_uid IN ARRAY ARRAY['uid-2', 'uid-3'] LOOP
        ASSERT fn_carrega_home_gestor(v_uid) IS NOT NULL;
    END LOOP;
    ASSERT fn_carrega_home_gestor('uid-1') IS NULL;
    ASSERT fn_carrega_home_gestor('uid-4') IS NULL;
    v_home := fn_carrega_home_gestor('uid-2');
    ASSERT (v_home #>> '{indicators,pending_validations}')::INTEGER = 3, 'Três perfis ativos do mesmo workspace';
    ASSERT JSONB_ARRAY_LENGTH(v_home->'pending_validations') = 3;
    ASSERT EXISTS (SELECT 1 FROM JSONB_ARRAY_ELEMENTS(v_home->'pending_validations') v WHERE v->>'collaborator_name' = 'Pessoa 3');
    ASSERT (v_home #>> '{indicators,collaborators_with_pending_events}')::INTEGER = 3, 'Participantes distintos';
    ASSERT (v_home #>> '{indicators,current_events}')::INTEGER = 1;
    ASSERT (SELECT quantidade_colaboradores = 3 FROM vw_unidades WHERE id_unidade = 1);
    ASSERT (SELECT quantidade_colaboradores = 1 FROM vw_unidades WHERE id_unidade = 2);
    ASSERT (SELECT quantidade_colaboradores = 0 FROM vw_unidades WHERE id_unidade = 5);
    ASSERT (SELECT quantidade_colaboradores = 4 AND quantidade_unidades = 3
                   AND quantidade_requisitos = 4 AND quantidade_conformes = 1
                   AND quantidade_proximos_vencimento = 1 AND quantidade_vencidos = 1
                   AND quantidade_pendentes = 1 AND percentual_conformidade_geral = 50.00
            FROM vw_home_estatisticas_gerais WHERE id_workspace = 1), 'Unidade ativa, status e maior validade por pessoa/NR';
    ASSERT (SELECT quantidade_colaboradores = 1 AND quantidade_requisitos = 1
            FROM vw_home_estatisticas_gerais WHERE id_workspace = 2);
    ASSERT (SELECT quantidade_colaboradores = 0 AND percentual_conformidade_geral = 0
            FROM vw_home_estatisticas_gerais WHERE id_workspace = 3);
    ASSERT (SELECT COUNT(*) = 1 FROM vw_conformidades WHERE usuario_id = 2 AND nr_id = 1), 'Sem duplicar gestor/NR';
    ASSERT (SELECT COUNT(*) = 1 FROM vw_conformidades WHERE usuario_id = 3 AND nr_id = 1);
    ASSERT (SELECT COUNT(*) = 1 FROM vw_conformidades WHERE usuario_id = 6), 'Listagem mantém unidade inativa';
    ASSERT (SELECT COUNT(*) = 1 FROM vw_conformidades WHERE usuario_id = 9), 'Listagem mantém gestor inativo';
    -- Ao expirar a turma sem envio, a conclusão em análise passa a prevalecer.
    UPDATE turma SET data_termino = LOCALTIMESTAMP - INTERVAL '1 minute' WHERE id_turma = 2;
    v_home := fn_carrega_home_colaborador('uid-3');
    ASSERT (v_home #>> '{events_metrics,pending}')::INTEGER = 0;
    ASSERT (v_home #>> '{events_metrics,under_analysis}')::INTEGER = 1;
END;
$$;
ROLLBACK;

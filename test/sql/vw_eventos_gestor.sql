-- Executar com psql em banco de teste: \i test/sql/vw_eventos_gestor.sql
-- Schema isolado; todos os objetos e dados são revertidos ao final.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_vw_eventos_gestor;
SET LOCAL search_path TO teste_vw_eventos_gestor;

-- Usar as tabelas e constraints reais, sem triggers ou cargas externas.
\ir ../../database/scripts/1_create_table.sql
\ir ../../database/scripts/2_constraints.sql

INSERT INTO workspace (id_workspace, nome, cnpj)
VALUES (1, 'Workspace teste', '99999999999655');
INSERT INTO unidade (id_unidade, workspace_id, nome, ativo)
VALUES (1, 1, 'Unidade teste', TRUE);
INSERT INTO cargo (id_cargo, workspace_id, nome, ativo)
VALUES (1, 1, 'Cargo teste', TRUE);
INSERT INTO usuario (id_usuario, nome, email, tipo, cargo_id, unidade_id, cpf, modalidade, status)
VALUES
    (1, 'Gestor um', 'gestor1@example.com', 'GESTOR', 1, 1, '11111111111', 'PRESENCIAL', 'ATIVO'),
    (2, 'Gestor dois', 'gestor2@example.com', 'GESTOR', 1, 1, '22222222222', 'PRESENCIAL', 'ATIVO');

INSERT INTO evento (id_evento, gestor_id, titulo, descricao, modo_conclusao, status)
VALUES
    (1, 1, 'Colaborador com pendencias', 'Teste de contagem', 'COLABORADOR', 'ATIVO'),
    (2, 1, 'Gestor com pendencias', 'Teste de contagem', 'GESTOR', 'ATIVO'),
    (3, 1, 'Sem turmas colaborador', 'Teste sem turmas', 'COLABORADOR', 'ATIVO'),
    (4, 1, 'Sem turmas gestor', 'Teste sem turmas', 'GESTOR', 'ATIVO'),
    (5, 1, 'Turma vazia colaborador', 'Teste turma vazia', 'COLABORADOR', 'ATIVO'),
    (6, 1, 'Turma vazia gestor', 'Teste turma vazia', 'GESTOR', 'ATIVO'),
    (7, 2, 'Evento concluido', 'Teste outro gestor', 'COLABORADOR', 'CONCLUIDO'),
    (8, 2, 'Evento cancelado', 'Teste outro gestor', 'GESTOR', 'ATIVO');
UPDATE evento SET status = 'CANCELADO', data_cancelamento = CURRENT_TIMESTAMP,
    motivo_cancelamento = 'Cancelamento de teste' WHERE id_evento = 8;

INSERT INTO turma (id_turma, evento_id, nome, data_inicial, data_termino)
SELECT id, evento, 'Turma ' || id, TIMESTAMP '2026-10-01 08:00:00', TIMESTAMP '2026-10-01 09:00:00'
FROM (VALUES (1, 1), (2, 1), (3, 2), (4, 2), (5, 5), (6, 6), (7, 7), (8, 8)) AS dados(id, evento);

-- O mesmo usuário em duas turmas representa duas participações distintas.
INSERT INTO turma_colaborador (id_turma_colaborador, turma_id, usuario_id)
VALUES (1, 1, 1), (2, 1, 2), (3, 2, 1), (4, 2, 2),
       (5, 3, 1), (6, 3, 2), (7, 4, 1), (8, 4, 2),
       (9, 7, 1), (10, 8, 2);
INSERT INTO conclusao_evento (id_conclusao_evento, turma_colaborador_id, status,
    data_conclusao, data_validacao, motivo_rejeicao)
VALUES
    (1, 1, 'PENDENTE', NULL, NULL, NULL),
    (2, 2, 'CONCLUIDO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
    (3, 3, 'PENDENTE', NULL, NULL, NULL),
    (4, 5, 'PENDENTE', NULL, NULL, NULL),
    (5, 6, 'REJEITADO', NULL, CURRENT_TIMESTAMP, 'Rejeicao de teste'),
    (6, 9, 'PENDENTE', NULL, NULL, NULL);

\ir ../../database/views/08_vw_eventos_gestor.sql
-- Reaplicar deve preservar o contrato e os resultados.
\ir ../../database/views/08_vw_eventos_gestor.sql

DO $$
BEGIN
    ASSERT (SELECT COUNT(*) = 8 FROM vw_eventos_gestor), 'Uma linha por evento';
    ASSERT (SELECT COUNT(DISTINCT id_evento) = 8 FROM vw_eventos_gestor);
    ASSERT (SELECT qtd_pendencias = 2 FROM vw_eventos_gestor WHERE id_evento = 1), 'Contar apenas PENDENTE, somando turmas';
    ASSERT (SELECT qtd_pendencias = 2 FROM vw_eventos_gestor WHERE id_evento = 2), 'Conclusoes existentes PENDENTE e REJEITADO nao sao ausencia';
    ASSERT (SELECT BOOL_AND(qtd_pendencias = 0) FROM vw_eventos_gestor WHERE id_evento BETWEEN 3 AND 6), 'Sem turmas ou participacoes retorna zero';
    ASSERT (SELECT status = 'CONCLUIDO' AND qtd_pendencias = 1 FROM vw_eventos_gestor WHERE id_evento = 7);
    ASSERT (SELECT status = 'CANCELADO' AND qtd_pendencias = 1 FROM vw_eventos_gestor WHERE id_evento = 8);
    ASSERT (SELECT COUNT(*) = 6 FROM vw_eventos_gestor WHERE id_gestor = 1), 'Filtro por gestor';
    ASSERT (SELECT COUNT(*) = 2 FROM vw_eventos_gestor WHERE id_gestor = 2);
    ASSERT NOT EXISTS (SELECT 1 FROM vw_eventos_gestor WHERE qtd_pendencias IS NULL);
    ASSERT NOT EXISTS (
        SELECT 1 FROM vw_eventos_gestor v JOIN evento e USING (id_evento)
        WHERE v.id_gestor IS DISTINCT FROM e.gestor_id OR v.titulo IS DISTINCT FROM e.titulo
           OR v.status IS DISTINCT FROM e.status OR v.modo_conclusao IS DISTINCT FROM e.modo_conclusao
    ), 'Preservar os dados do evento';

    UPDATE conclusao_evento SET status = 'REJEITADO', data_validacao = CURRENT_TIMESTAMP,
        motivo_rejeicao = 'Rejeicao de teste' WHERE id_conclusao_evento = 1;
    ASSERT (SELECT qtd_pendencias = 1 FROM vw_eventos_gestor WHERE id_evento = 1), 'Rejeitado nao e pendente';
    UPDATE conclusao_evento SET status = 'CONCLUIDO', data_conclusao = CURRENT_TIMESTAMP,
        data_validacao = CURRENT_TIMESTAMP WHERE id_conclusao_evento = 3;
    ASSERT (SELECT qtd_pendencias = 0 FROM vw_eventos_gestor WHERE id_evento = 1);

    INSERT INTO conclusao_evento (id_conclusao_evento, turma_colaborador_id, status, data_conclusao, data_validacao)
    VALUES (7, 7, 'CONCLUIDO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
           (8, 8, 'CONCLUIDO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    ASSERT (SELECT qtd_pendencias = 0 FROM vw_eventos_gestor WHERE id_evento = 2), 'Gestor sem pendencias';
END;
$$;
ROLLBACK;

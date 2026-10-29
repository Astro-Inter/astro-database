-- Executar com psql em banco de teste; schema isolado e rollback ao final.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_scrum_670;
SET LOCAL search_path = teste_scrum_670;

CREATE TABLE unidade (id_unidade BIGINT PRIMARY KEY, workspace_id BIGINT, nome VARCHAR(255));
CREATE TABLE usuario (
    id_usuario BIGINT PRIMARY KEY, nome VARCHAR(255), unidade_id BIGINT,
    firebase_uid TEXT UNIQUE, tipo VARCHAR(50), status VARCHAR(50)
);
CREATE TABLE evento (id_evento BIGINT PRIMARY KEY, titulo VARCHAR(255), status VARCHAR(50));
CREATE TABLE turma (id_turma BIGINT PRIMARY KEY, evento_id BIGINT, data_termino TIMESTAMP);
CREATE TABLE turma_colaborador (
    id_turma_colaborador BIGINT PRIMARY KEY, turma_id BIGINT, usuario_id BIGINT,
    UNIQUE (turma_id, usuario_id)
);
CREATE TABLE conclusao_evento (turma_colaborador_id BIGINT UNIQUE, status VARCHAR(50));
-- Contrato mínimo da view; a autorização usa a função real.
CREATE VIEW vw_unidades AS SELECT id_unidade, workspace_id AS id_workspace, nome FROM unidade;
\ir ../../database/functions/15_fn_seleciona_unidades.sql
\ir ../../database/functions/21_fn_carrega_evento_colaborador.sql
\ir ../../database/functions/21_fn_carrega_evento_colaborador.sql

INSERT INTO unidade VALUES (1, 1, 'Principal'), (2, 1, 'Filial'), (3, 2, 'Externa');
INSERT INTO usuario VALUES
    (1, 'Gestor', 1, 'gestor', 'GESTOR', 'ATIVO'),
    (2, 'Ana', 2, 'ana', 'COLABORADOR', 'DESATIVADO'),
    (3, 'Gestor workspace', 1, 'workspace', 'GESTOR_WORKSPACE', 'ATIVO'),
    (4, 'Externo', 3, 'externo', 'COLABORADOR', 'ATIVO'),
    (5, 'Admin', 1, 'admin', 'ADMIN', 'ATIVO'),
    (6, 'Gestor inativo', 1, 'inativo', 'GESTOR', 'DESATIVADO'),
    (7, 'Sem eventos', 1, 'sem-eventos', 'COLABORADOR', 'PRE_CADASTRADO');
INSERT INTO evento VALUES (1, 'Treinamento', 'ATIVO'), (2, 'Cancelado', 'CANCELADO');
INSERT INTO turma VALUES
    (1, 1, NULL), (2, 1, TIMESTAMP '2020-01-01 12:00:00'),
    (3, 2, TIMESTAMP '2099-01-01 12:00:00');
INSERT INTO turma_colaborador VALUES
    (1, 1, 2), (2, 2, 2), (3, 3, 2), (4, 1, 1),
    (5, 1, 3), (6, 1, 4), (7, 1, 5), (8, 1, 6);
INSERT INTO conclusao_evento VALUES (2, 'CONCLUIDO'), (3, 'REJEITADO'), (4, 'PENDENTE');

DO $$ BEGIN
    ASSERT (SELECT COUNT(*) = 3 FROM fn_carrega_evento_colaborador('gestor', 2)),
        'Manter colaborador inativo, múltiplas turmas, evento cancelado e turma encerrada';
    ASSERT (SELECT row(id_colaborador, nome_colaborador, id_evento, titulo_evento, status_evento)
                = row(2::BIGINT, 'Ana'::VARCHAR, 1::BIGINT, 'Treinamento'::VARCHAR, 'ATIVO'::VARCHAR)
            FROM fn_carrega_evento_colaborador('gestor', 2) WHERE data_limite_turma IS NULL),
        'Retornar os campos do colaborador e do evento';
    ASSERT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', 2)
                   WHERE data_limite_turma IS NULL AND status_conclusao IS NULL),
        'Preservar prazo nulo e ausência de conclusão';
    ASSERT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', 2)
                   WHERE data_limite_turma = TIMESTAMP '2020-01-01 12:00:00' AND status_conclusao = 'CONCLUIDO'),
        'Retornar data limite e status da conclusão';
    ASSERT (SELECT array_agg(id_evento) = ARRAY[1,1,2]::BIGINT[]
            FROM fn_carrega_evento_colaborador('gestor', 2)), 'Ordenar por evento e turma';
    ASSERT (SELECT COUNT(*) = 3 FROM fn_carrega_evento_colaborador('workspace', 2)), 'Permitir gestor de workspace';
    ASSERT (SELECT status_conclusao = 'PENDENTE' FROM fn_carrega_evento_colaborador('gestor', 1)), 'Permitir consulta própria';
    ASSERT (SELECT COUNT(*) = 1 FROM fn_carrega_evento_colaborador('gestor', 3)), 'Incluir perfil gestor de workspace';
    ASSERT (SELECT COUNT(*) = 1 FROM fn_carrega_evento_colaborador('gestor', 6)), 'Incluir gestor inativo como alvo';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', 4)), 'Isolar outro workspace';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', 5)), 'Excluir alvo ADMIN';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', 7)), 'Colaborador sem participações';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', NULL)), 'ID nulo';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('gestor', 999)), 'ID inexistente';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador(NULL, 2)), 'UID nulo';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('  ', 2)), 'UID vazio';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('inexistente', 2)), 'UID inexistente';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('ana', 2)), 'Solicitante colaborador';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('admin', 2)), 'Solicitante ADMIN';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_evento_colaborador('inativo', 2)), 'Solicitante inativo';
END $$;
ROLLBACK;

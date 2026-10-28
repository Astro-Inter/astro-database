-- Executar com psql em banco de teste, a partir de qualquer diretório.
-- Fixtures mínimas isoladas; não substitui objetos instalados nem preserva dados.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_scrum_668;
SET LOCAL search_path = teste_scrum_668;

CREATE TABLE unidade (id_unidade BIGINT PRIMARY KEY, workspace_id BIGINT);
CREATE TABLE cargo (id_cargo BIGINT PRIMARY KEY, nome VARCHAR(255));
CREATE TABLE usuario (
    id_usuario BIGINT PRIMARY KEY, nome VARCHAR(255), email TEXT, cpf TEXT,
    modalidade TEXT, status TEXT, cargo_id BIGINT, unidade_id BIGINT,
    firebase_uid TEXT UNIQUE, tipo TEXT
);
CREATE TABLE evento (id_evento BIGINT PRIMARY KEY, gestor_id BIGINT, status TEXT);
CREATE TABLE turma (id_turma BIGINT PRIMARY KEY, evento_id BIGINT, data_termino TIMESTAMP);
CREATE TABLE turma_colaborador (
    id_turma_colaborador BIGINT PRIMARY KEY, turma_id BIGINT, usuario_id BIGINT
);
CREATE TABLE conclusao_evento (
    turma_colaborador_id BIGINT UNIQUE, status TEXT,
    data_conclusao TIMESTAMP, data_validacao TIMESTAMP
);
ALTER TABLE unidade ADD COLUMN nome VARCHAR(255);
\ir ../../database/views/05_vw_colaboradores.sql
-- Contrato mínimo da view; a autorização usa a função real do repositório.
CREATE VIEW vw_unidades AS SELECT id_unidade, workspace_id AS id_workspace, nome FROM unidade;
\ir ../../database/functions/15_fn_seleciona_unidades.sql
\ir ../../database/functions/20_fn_carrega_colaboradores.sql
\ir ../../database/functions/20_fn_carrega_colaboradores.sql

INSERT INTO unidade VALUES (1, 1, 'Principal'), (2, 1, 'Filial'), (3, 2, 'Externa');
INSERT INTO cargo VALUES (1, 'Analista');
INSERT INTO usuario (id_usuario, nome, status, cargo_id, unidade_id, firebase_uid, tipo) VALUES
    (1, 'Solicitante', 'ATIVO', 1, 1, 'gestor', 'GESTOR'),
    (2, 'Ana', 'ATIVO', 1, 2, 'ana', 'COLABORADOR'),
    (3, 'Bia', 'ATIVO', 1, 1, 'bia', 'GESTOR_WORKSPACE'),
    (4, 'Caio', 'DESATIVADO', 1, 1, 'caio', 'GESTOR'),
    (5, 'Externo', 'ATIVO', 1, 3, 'externo', 'GESTOR'),
    (6, 'Admin', 'ATIVO', 1, 1, 'admin', 'ADMIN'),
    (7, 'Dani', 'PRE_CADASTRADO', 1, 1, 'dani', 'COLABORADOR'),
    (8, 'Ana', 'ATIVO', 1, 1, 'ana2', 'GESTOR');
INSERT INTO evento VALUES
    (1, 1, 'ATIVO'), (2, 1, 'ATIVO'), (3, 1, 'ATIVO'),
    (4, 1, 'ATIVO'), (5, 1, 'ATIVO'), (6, 1, 'CANCELADO'), (7, 5, 'ATIVO');
INSERT INTO turma VALUES
    (1, 1, NULL), (2, 1, LOCALTIMESTAMP + INTERVAL '1 day'),
    (3, 2, NULL), (4, 3, NULL), (5, 4, NULL),
    (6, 5, LOCALTIMESTAMP - INTERVAL '1 day'), (7, 6, NULL), (8, 7, NULL),
    (9, 1, LOCALTIMESTAMP);
INSERT INTO turma_colaborador VALUES
    (1, 1, 2), (2, 2, 2), (3, 3, 2), (4, 4, 2), (5, 5, 2),
    (6, 6, 2), (7, 7, 2), (8, 8, 2), (9, 1, 4), (10, 1, 7),
    (11, 9, 8), (12, 2, 8);
INSERT INTO conclusao_evento VALUES
    (2, 'REJEITADO', LOCALTIMESTAMP, LOCALTIMESTAMP),
    (3, 'CONCLUIDO', LOCALTIMESTAMP, LOCALTIMESTAMP),
    (4, 'PENDENTE', LOCALTIMESTAMP, NULL),
    (5, 'PENDENTE', NULL, NULL),
    (12, 'CONCLUIDO', LOCALTIMESTAMP, LOCALTIMESTAMP);

DO $$ BEGIN
    ASSERT (SELECT COUNT(*) = 5 FROM fn_carrega_colaboradores('gestor')),
        'Listar todos os perfis e status da view, excluindo solicitante, ADMIN e outro workspace';
    ASSERT (SELECT quantidade_pendencias = 2 FROM fn_carrega_colaboradores('gestor') WHERE id_usuario = 2),
        'Deduplicar evento, contar não enviado/rejeitado, excluir concluído, aguardando validação, expirado, cancelado e externo';
    ASSERT (SELECT quantidade_pendencias = 1 FROM fn_carrega_colaboradores('gestor') WHERE id_usuario = 8),
        'Término no instante atual conta; conclusão em outra turma não elimina pendência';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('gestor') WHERE id_usuario IN (3, 4, 7) AND quantidade_pendencias <> 0),
        'Sem participação e usuários não ativos retornam zero';
    ASSERT (SELECT array_agg(id_usuario) = ARRAY[2,8,4,7,1]::BIGINT[] FROM fn_carrega_colaboradores('bia')),
        'Gestor de workspace pode listar, com ordenação por nome e ID e exclusão própria';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores(NULL)), 'UID nulo';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('   ')), 'UID vazio';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('inexistente')), 'UID inexistente';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('ana')), 'Colaborador não pode consultar';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('caio')), 'Gestor inativo não pode consultar';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('admin')), 'ADMIN não pode consultar';
    ASSERT NOT EXISTS (SELECT FROM fn_carrega_colaboradores('externo')), 'Não vazar colaboradores de outro workspace';
END $$;
ROLLBACK;

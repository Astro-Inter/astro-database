-- Executar com psql em banco de teste. Usa schema isolado e desfaz tudo.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_scrum_624;
SET LOCAL search_path = teste_scrum_624;

CREATE TABLE nr_catalogo (
    codigo_nr INTEGER PRIMARY KEY,
    tempo_reciclagem_mes INTEGER NOT NULL CHECK (tempo_reciclagem_mes > 0)
);
CREATE TABLE evento (id_evento BIGINT PRIMARY KEY, nr_id INTEGER REFERENCES nr_catalogo);
CREATE TABLE turma (id_turma BIGINT PRIMARY KEY, evento_id BIGINT REFERENCES evento);
CREATE TABLE turma_colaborador (
    id_turma_colaborador BIGINT PRIMARY KEY,
    turma_id BIGINT REFERENCES turma,
    usuario_id BIGINT NOT NULL
);
CREATE TABLE conclusao_evento (
    id_conclusao_evento BIGINT PRIMARY KEY,
    turma_colaborador_id BIGINT REFERENCES turma_colaborador,
    status VARCHAR(50),
    data_validade DATE,
    data_conclusao TIMESTAMP,
    CHECK (status <> 'CONCLUIDO' OR data_conclusao IS NOT NULL)
);
CREATE TABLE conformidade (
    id_conformidade BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    nr_id INTEGER NOT NULL,
    aplicavel BOOLEAN NOT NULL,
    data_validade DATE,
    origem VARCHAR(50) NOT NULL,
    conclusao_evento_id BIGINT UNIQUE REFERENCES conclusao_evento
);

-- A função também fica no schema isolado, sem substituir a função instalada.
\ir ../../database/functions/19_fn_criar_conformidade_por_evento.sql
\ir ../../database/triggers/05_criar_conformidade_por_evento.sql
-- Reinstalar a trigger precisa ser seguro.
\ir ../../database/triggers/05_criar_conformidade_por_evento.sql

INSERT INTO nr_catalogo VALUES (35, 12), (10, 24), (20, 1);
INSERT INTO evento VALUES (1, 35), (2, NULL), (3, 10), (4, 20);
INSERT INTO turma VALUES (1, 1), (2, 2), (3, 3), (4, 4);
INSERT INTO turma_colaborador VALUES
    (1, 1, 10), (2, 1, 20), (3, 2, 10), (4, 1, 10), (5, 3, 20), (6, 4, 20);
INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem)
VALUES (10, 35, FALSE, DATE '2030-01-01', 'MANUAL');
INSERT INTO conclusao_evento VALUES
    (1, 1, 'PENDENTE', NULL, NULL),
    (2, 2, 'REJEITADO', NULL, NULL),
    (3, 3, 'CONCLUIDO', DATE '2028-01-01', TIMESTAMP '2026-10-25 14:30:00');

DO $$ BEGIN
    ASSERT (SELECT COUNT(*) = 1 FROM conformidade), 'Pendente, rejeitado e evento sem NR não geram conformidade';
END $$;

-- Validade informada propositalmente diferente: a função deve ignorá-la.
UPDATE conclusao_evento
SET status = 'CONCLUIDO', data_validade = DATE '2035-01-01', data_conclusao = TIMESTAMP '2026-10-25 14:30:00'
WHERE id_conclusao_evento = 1;
INSERT INTO conclusao_evento VALUES (4, 4, 'CONCLUIDO', NULL, TIMESTAMP '2024-02-29 23:59:59');

DO $$ BEGIN
    ASSERT (SELECT usuario_id = 10 AND nr_id = 35 AND aplicavel
                   AND origem = 'EVENTO' AND data_validade = DATE '2027-10-25'
            FROM conformidade WHERE conclusao_evento_id = 1), 'Conclusão aprovada gera conformidade';
    ASSERT (SELECT data_validade = DATE '2025-02-28' FROM conformidade WHERE conclusao_evento_id = 4), 'Ano bissexto e validade calculada mesmo sem validade informada';
    ASSERT (SELECT data_validade = DATE '2035-01-01' FROM conclusao_evento WHERE id_conclusao_evento = 1), 'Validade da conclusão não é alterada';
    ASSERT (SELECT COUNT(*) = 3 FROM conformidade), 'Histórico por conclusão é mantido';
END $$;

UPDATE conclusao_evento SET status = 'CONCLUIDO' WHERE id_conclusao_evento = 1;
UPDATE conclusao_evento SET data_conclusao = TIMESTAMP '2027-01-31 08:00:00' WHERE id_conclusao_evento = 1;
UPDATE conclusao_evento SET data_validade = DATE '2040-01-01' WHERE id_conclusao_evento = 1;
DO $$ BEGIN
    ASSERT (SELECT COUNT(*) = 3 FROM conformidade), 'Repetição não duplica conformidade';
    ASSERT (SELECT data_validade = DATE '2028-01-31' FROM conformidade WHERE conclusao_evento_id = 1), 'Correção da data de conclusão recalcula validade; validade manual é ignorada';
    ASSERT (SELECT NOT aplicavel AND origem = 'MANUAL' AND data_validade = DATE '2030-01-01'
            FROM conformidade WHERE conclusao_evento_id IS NULL), 'Conformidade manual preservada';
END $$;

INSERT INTO conclusao_evento VALUES
    (5, 5, 'CONCLUIDO', NULL, TIMESTAMP '2026-10-25 12:00:00'),
    (6, 6, 'CONCLUIDO', NULL, TIMESTAMP '2028-01-31 12:00:00');
DO $$ BEGIN
    ASSERT (SELECT nr_id = 10 AND data_validade = DATE '2028-10-25'
            FROM conformidade WHERE conclusao_evento_id = 5), 'Prazo de 24 meses vem da NR correspondente';
    ASSERT (SELECT nr_id = 20 AND data_validade = DATE '2028-02-29'
            FROM conformidade WHERE conclusao_evento_id = 6), 'Meses de calendário ajustam o final do mês';
    ASSERT (SELECT COUNT(*) = 5 FROM conformidade), 'Uma conformidade por conclusão com NR, mais a manual';
END $$;
ROLLBACK;

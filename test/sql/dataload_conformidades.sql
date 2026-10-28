\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_scrum_657_carga;
SET LOCAL search_path = teste_scrum_657_carga;
\ir ../../database/scripts/1_create_table.sql
\ir ../../database/scripts/2_constraints.sql

INSERT INTO workspace(id_workspace,nome,cnpj) VALUES (1,'Teste carga','00000000001657');
INSERT INTO unidade(id_unidade,workspace_id,nome,ativo) VALUES
    (1,1,'Matriz',TRUE),(2,1,'Inativa',FALSE);
INSERT INTO cargo(id_cargo,workspace_id,nome) VALUES (1,1,'Cargo teste');
INSERT INTO usuario(id_usuario,nome,email,tipo,cargo_id,unidade_id,status) VALUES
    (1,'Pessoa teste','pessoa.c689bedf0fc64d4c.1@example.com','COLABORADOR',1,1,'ATIVO');
INSERT INTO nr_catalogo(codigo_nr,titulo,tempo_reciclagem_mes,revogada) VALUES
    (1,'NR teste 1',12,FALSE),(10,'NR teste 10',12,FALSE),(99,'NR revogada',12,TRUE);
INSERT INTO cargo_nr(cargo_id,nr_id) VALUES (1,10);
INSERT INTO unidade_nr(unidade_id,nr_id) VALUES (1,1),(1,10),(1,99),(2,1);

\ir ../../database/dataload/14_conformidade.sql
\ir ../../database/dataload/14_conformidade.sql

DO $$ BEGIN
    ASSERT (SELECT COUNT(*)=1 FROM conformidade WHERE tipo='COLABORADOR'
        AND usuario_id=1 AND unidade_id IS NULL AND nr_id=10), 'Preserva carga de colaboradores sem duplicar';
    ASSERT (SELECT COUNT(*)=2 FROM conformidade WHERE tipo='UNIDADE'), 'Somente requisitos ativos e vigentes, sem duplicar';
    ASSERT NOT EXISTS (SELECT 1 FROM conformidade WHERE tipo='UNIDADE'
        AND (unidade_id<>1 OR usuario_id IS NOT NULL OR origem<>'MANUAL'
        OR data_validade IS NOT NULL OR formulario_resposta_id IS NOT NULL OR NOT aplicavel)),
        'Carga de unidades mantém pendências sem inventar evidência ou validade';
END $$;
ROLLBACK;

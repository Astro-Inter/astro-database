\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA teste_scrum_657_home;
SET LOCAL search_path = teste_scrum_657_home;
\ir ../../database/scripts/1_create_table.sql
\ir ../../database/scripts/2_constraints.sql
\ir ../../database/views/04_vw_home_estatisticas_gerais.sql

INSERT INTO workspace(id_workspace,nome,cnpj) VALUES
    (1,'Home local','00000000001657'),(2,'Outro workspace','00000000001658'),(3,'Sem requisitos','00000000001659');
INSERT INTO unidade(id_unidade,workspace_id,nome,ativo) VALUES
    (1,1,'Matriz',TRUE),(2,1,'Filial',TRUE),(3,1,'Inativa',FALSE),(4,2,'Outra empresa',TRUE);
INSERT INTO cargo(id_cargo,workspace_id,nome) VALUES(1,1,'Cargo de teste');
INSERT INTO usuario(id_usuario,nome,email,tipo,cargo_id,unidade_id,status) VALUES
    (1,'Pessoa teste','pessoa@example.test','GESTOR',1,1,'ATIVO');
INSERT INTO nr_catalogo(codigo_nr,titulo,tempo_reciclagem_mes,revogada) VALUES
    (1,'NR teste 1',12,FALSE),(6,'NR teste 6',12,FALSE),(10,'NR teste 10',12,FALSE),(99,'NR revogada',12,TRUE);
INSERT INTO unidade_nr(unidade_id,nr_id) VALUES(1,1),(1,6),(1,99),(2,1),(3,1),(4,1);

DO $$ BEGIN
    ASSERT (SELECT quantidade_requisitos=3 AND quantidade_pendentes=3 AND percentual_conformidade_geral=0
        FROM vw_home_estatisticas_gerais WHERE id_workspace=1), 'NRs obrigatórias sem conformidade são pendentes; exclui inativas e revogadas';
    ASSERT (SELECT quantidade_requisitos=1 AND quantidade_pendentes=1 FROM vw_home_estatisticas_gerais WHERE id_workspace=2), 'Isolamento entre workspaces';
    ASSERT (SELECT quantidade_requisitos=0 AND percentual_conformidade_geral=0 FROM vw_home_estatisticas_gerais WHERE id_workspace=3), 'Workspace sem requisitos';
END $$;

INSERT INTO conformidade(usuario_id,nr_id,aplicavel,data_validade,origem) VALUES(1,10,TRUE,CURRENT_DATE+60,'MANUAL');
INSERT INTO conformidade(tipo,unidade_id,nr_id,aplicavel,data_validade,origem) VALUES
    ('UNIDADE',1,1,TRUE,CURRENT_DATE+60,'MANUAL'),
    ('UNIDADE',1,1,TRUE,CURRENT_DATE-1,'MANUAL'),
    ('UNIDADE',1,1,FALSE,CURRENT_DATE+1000,'MANUAL'),
    ('UNIDADE',1,6,TRUE,CURRENT_DATE+30,'MANUAL'),
    ('UNIDADE',2,10,TRUE,CURRENT_DATE-1,'MANUAL'),
    ('UNIDADE',3,1,TRUE,CURRENT_DATE+60,'MANUAL'),
    ('UNIDADE',1,99,TRUE,CURRENT_DATE+60,'MANUAL');
DO $$ BEGIN
    ASSERT (SELECT quantidade_requisitos=5 AND quantidade_conformes=2 AND quantidade_proximos_vencimento=1
        AND quantidade_vencidos=1 AND quantidade_pendentes=1 AND percentual_conformidade_geral=60
        FROM vw_home_estatisticas_gerais WHERE id_workspace=1), 'Soma pessoas e unidades, deduplica histórico e inclui registro fora de unidade_nr';
END $$;

INSERT INTO conformidade(tipo,unidade_id,nr_id,aplicavel,data_validade,origem)
VALUES('UNIDADE',2,1,FALSE,CURRENT_DATE+60,'MANUAL');
DO $$ BEGIN
    ASSERT (SELECT quantidade_requisitos=4 AND quantidade_pendentes=0 AND percentual_conformidade_geral=75
        FROM vw_home_estatisticas_gerais WHERE id_workspace=1), 'Exclusão explícita de par não aplicável';
END $$;
INSERT INTO conformidade(tipo,unidade_id,nr_id,aplicavel,data_validade,origem)
VALUES('UNIDADE',2,1,TRUE,NULL,'MANUAL');
UPDATE conformidade SET data_validade=CURRENT_DATE WHERE tipo='UNIDADE' AND unidade_id=1 AND nr_id=6;
DO $$ BEGIN
    ASSERT (SELECT quantidade_requisitos=5 AND quantidade_pendentes=1 AND quantidade_proximos_vencimento=1
        AND quantidade_conformes+quantidade_proximos_vencimento+quantidade_vencidos+quantidade_pendentes=quantidade_requisitos
        FROM vw_home_estatisticas_gerais WHERE id_workspace=1), 'Validade nula é pendente; hoje é próximo do vencimento; categorias exclusivas';
END $$;
ROLLBACK;

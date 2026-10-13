-- Executar em um banco de teste com as tabelas, constraints e vw_conformidades aplicadas.
-- Os dados de teste e suas alterações são revertidos ao final.
BEGIN;
DO $$
DECLARE
    v_workspace BIGINT;
    v_outro_workspace BIGINT;
    v_unidade BIGINT;
    v_outra_unidade BIGINT;
    v_cargo BIGINT;
    v_outro_cargo BIGINT;
    v_usuario BIGINT;
    v_outro_usuario BIGINT;
    v_pre_cadastrado BIGINT;
    v_desativado BIGINT;
    v_gestor BIGINT;
    v_evento BIGINT;
    v_turma BIGINT;
    v_participacao BIGINT;
    v_conclusao BIGINT;
    v_selecionado BIGINT;
    v_sem_validade BIGINT;
    v_nao_aplicavel BIGINT;
BEGIN
    INSERT INTO workspace (nome, cnpj) VALUES ('Conformidades teste', '99999999999534')
    RETURNING id_workspace INTO v_workspace;
    INSERT INTO workspace (nome, cnpj) VALUES ('Outro workspace teste', '99999999999535')
    RETURNING id_workspace INTO v_outro_workspace;
    INSERT INTO unidade (workspace_id, nome, ativo) VALUES (v_workspace, 'Unidade inativa', FALSE)
    RETURNING id_unidade INTO v_unidade;
    INSERT INTO unidade (workspace_id, nome) VALUES (v_outro_workspace, 'Outra unidade')
    RETURNING id_unidade INTO v_outra_unidade;
    INSERT INTO cargo (workspace_id, nome, ativo) VALUES (v_workspace, 'Cargo inativo', FALSE)
    RETURNING id_cargo INTO v_cargo;
    INSERT INTO cargo (workspace_id, nome) VALUES (v_outro_workspace, 'Outro cargo')
    RETURNING id_cargo INTO v_outro_cargo;
    INSERT INTO nr_catalogo (codigo_nr, titulo, tempo_reciclagem_mes, revogada)
    VALUES (99534, 'NR de teste', 12, FALSE), (99535, 'NR revogada de teste', 12, TRUE);

    INSERT INTO usuario (nome, email, tipo, cargo_id, unidade_id, status)
    VALUES ('Colaborador teste', 'conformidade534@example.com', 'COLABORADOR', v_cargo, v_unidade, 'ATIVO')
    RETURNING id_usuario INTO v_usuario;
    INSERT INTO usuario (nome, email, tipo, cargo_id, unidade_id, status)
    VALUES ('Outro colaborador', 'conformidade535@example.com', 'COLABORADOR', v_outro_cargo, v_outra_unidade, 'ATIVO')
    RETURNING id_usuario INTO v_outro_usuario;
    INSERT INTO usuario (nome, email, tipo, cargo_id, unidade_id, status)
    VALUES ('Pré-cadastrado teste', 'conformidade536@example.com', 'COLABORADOR', v_cargo, v_unidade, 'PRE_CADASTRADO')
    RETURNING id_usuario INTO v_pre_cadastrado;
    INSERT INTO usuario (nome, email, tipo, cargo_id, unidade_id, status)
    VALUES ('Desativado teste', 'conformidade537@example.com', 'COLABORADOR', v_cargo, v_unidade, 'DESATIVADO')
    RETURNING id_usuario INTO v_desativado;
    INSERT INTO usuario (nome, email, tipo, cargo_id, unidade_id, status)
    VALUES ('Gestor teste', 'conformidade538@example.com', 'GESTOR', v_cargo, v_unidade, 'ATIVO')
    RETURNING id_usuario INTO v_gestor;

    INSERT INTO evento (gestor_id, nr_id, titulo, descricao, modo_conclusao)
    VALUES (v_gestor, 99534, 'Evento teste', 'Descrição teste', 'GESTOR')
    RETURNING id_evento INTO v_evento;
    INSERT INTO turma (evento_id, nome, data_inicial, data_termino)
    VALUES (v_evento, 'Turma teste', CURRENT_DATE - 1, CURRENT_DATE)
    RETURNING id_turma INTO v_turma;
    INSERT INTO turma_funcionario (turma_id, usuario_id) VALUES (v_turma, v_usuario)
    RETURNING id_turma_funcionario INTO v_participacao;
    INSERT INTO conclusao_evento (turma_funcionario_id, status, data_conclusao, data_validacao, data_validade)
    VALUES (v_participacao, 'CONCLUIDO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_DATE + 40)
    RETURNING id_conclusao_evento INTO v_conclusao;

    -- A maior validade aplicável vence; em empate, o maior ID fornece todos os metadados.
    INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem)
    VALUES (v_usuario, 99534, TRUE, CURRENT_DATE + 10, 'MANUAL'),
           (v_usuario, 99534, TRUE, CURRENT_DATE + 40, 'MANUAL');
    INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem, conclusao_evento_id)
    VALUES (v_usuario, 99534, TRUE, CURRENT_DATE + 40, 'CONCLUSAO_EVENTO', v_conclusao)
    RETURNING id_conformidade INTO v_selecionado;
    INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem)
    VALUES (v_usuario, 99534, TRUE, NULL, 'ANALISE_CARGO')
    RETURNING id_conformidade INTO v_sem_validade;
    INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem)
    VALUES (v_usuario, 99534, FALSE, CURRENT_DATE + 400, 'MANUAL')
    RETURNING id_conformidade INTO v_nao_aplicavel;

    ASSERT (SELECT COUNT(*) = 1 FROM vw_conformidades WHERE usuario_id = v_usuario AND nr_id = 99534);
    ASSERT (SELECT id_conformidade = v_selecionado AND aplicavel
                   AND origem = 'CONCLUSAO_EVENTO' AND conclusao_evento_id = v_conclusao
                   AND data_validade = CURRENT_DATE + 40 AND status = 'Válida'
                   AND nome = 'Colaborador teste' AND email = 'conformidade534@example.com'
                   AND titulo_nr = 'NR de teste' AND cargo_id = v_cargo
                   AND unidade_id = v_unidade AND workspace_id = v_workspace
            FROM vw_conformidades WHERE usuario_id = v_usuario AND nr_id = 99534);
    ASSERT (SELECT COUNT(*) = 5 FROM conformidade WHERE usuario_id = v_usuario AND nr_id = 99534),
           'A leitura não remove histórico';

    INSERT INTO conformidade (usuario_id, nr_id, aplicavel, data_validade, origem)
    VALUES (v_outro_usuario, 99534, TRUE, CURRENT_DATE, 'MANUAL'),
           (v_pre_cadastrado, 99534, TRUE, CURRENT_DATE - 1, 'MANUAL'),
           (v_desativado, 99534, TRUE, NULL, 'MANUAL'),
           (v_gestor, 99534, TRUE, CURRENT_DATE + 40, 'MANUAL'),
           (v_usuario, 99535, FALSE, NULL, 'MANUAL');
    ASSERT (SELECT COUNT(*) = 5 FROM vw_conformidades WHERE nr_id IN (99534, 99535));
    ASSERT NOT EXISTS (SELECT 1 FROM vw_conformidades WHERE usuario_id = v_gestor);
    ASSERT (SELECT status = 'Válida' AND workspace_id = v_outro_workspace
            FROM vw_conformidades WHERE usuario_id = v_outro_usuario AND nr_id = 99534),
           'Validade de hoje é vigente e o workspace não se mistura';
    ASSERT (SELECT status = 'Vencida' AND status_colaborador = 'PRE_CADASTRADO'
            FROM vw_conformidades WHERE usuario_id = v_pre_cadastrado AND nr_id = 99534);
    ASSERT (SELECT status = 'Sem validade' AND status_colaborador = 'DESATIVADO'
            FROM vw_conformidades WHERE usuario_id = v_desativado AND nr_id = 99534);
    ASSERT (SELECT NOT aplicavel AND status = 'Sem validade'
            FROM vw_conformidades WHERE usuario_id = v_usuario AND nr_id = 99535),
           'Mantém o par inteiramente não aplicável e a NR revogada';

    -- Editar o ID selecionado deixa o outro certificado intacto e pode mudar o representante.
    UPDATE conformidade SET data_validade = CURRENT_DATE + 20 WHERE id_conformidade = v_selecionado;
    ASSERT (SELECT data_validade = CURRENT_DATE + 20 FROM conformidade WHERE id_conformidade = v_selecionado);
    ASSERT (SELECT id_conformidade <> v_selecionado AND origem = 'MANUAL'
                   AND data_validade = CURRENT_DATE + 40
            FROM vw_conformidades WHERE usuario_id = v_usuario AND nr_id = 99534);

    -- Mesmo sem nenhuma data entre os aplicáveis, eles precedem um não aplicável com data.
    UPDATE conformidade SET data_validade = NULL
    WHERE usuario_id = v_usuario AND nr_id = 99534 AND aplicavel;
    ASSERT (SELECT id_conformidade = v_sem_validade AND aplicavel AND status = 'Sem validade'
            FROM vw_conformidades WHERE usuario_id = v_usuario AND nr_id = 99534);
    UPDATE conformidade SET aplicavel = FALSE WHERE usuario_id = v_usuario AND nr_id = 99534;
    ASSERT (SELECT id_conformidade = v_nao_aplicavel AND NOT aplicavel
                   AND data_validade = CURRENT_DATE + 400
            FROM vw_conformidades WHERE usuario_id = v_usuario AND nr_id = 99534);
END;
$$;
ROLLBACK;

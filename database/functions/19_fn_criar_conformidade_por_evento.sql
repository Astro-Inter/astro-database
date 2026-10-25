CREATE OR REPLACE FUNCTION fn_criar_conformidade_por_evento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO conformidade
        (usuario_id, nr_id, aplicavel, data_validade, origem, conclusao_evento_id)
    SELECT
        participante.usuario_id,
        evento.nr_id,
        TRUE,
        (NEW.data_conclusao::DATE + MAKE_INTERVAL(months => nr.tempo_reciclagem_mes))::DATE,
        'EVENTO',
        NEW.id_conclusao_evento
    FROM turma_colaborador participante
    INNER JOIN turma ON turma.id_turma = participante.turma_id
    INNER JOIN evento ON evento.id_evento = turma.evento_id
    INNER JOIN nr_catalogo nr ON nr.codigo_nr = evento.nr_id
    WHERE participante.id_turma_colaborador = NEW.turma_colaborador_id
      AND evento.nr_id IS NOT NULL
      AND NEW.status = 'CONCLUIDO'
    ON CONFLICT (conclusao_evento_id) DO UPDATE
    SET usuario_id = EXCLUDED.usuario_id,
        nr_id = EXCLUDED.nr_id,
        aplicavel = EXCLUDED.aplicavel,
        data_validade = EXCLUDED.data_validade,
        origem = EXCLUDED.origem;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_criar_conformidade_por_evento() IS
'Cria ou atualiza a conformidade de origem EVENTO para uma conclusão CONCLUIDO com NR. Calcula a validade somando tempo_reciclagem_mes do catálogo à data_conclusao da participação. Mantém um registro por conclusão e preserva as demais conformidades. Não trata reversão, cancelamento ou alterações posteriores no catálogo, evento e participação.';

DROP TRIGGER IF EXISTS trg_criar_conformidade_por_evento ON conclusao_evento;
CREATE TRIGGER trg_criar_conformidade_por_evento
AFTER INSERT OR UPDATE OF status, data_conclusao, turma_colaborador_id ON conclusao_evento
FOR EACH ROW
WHEN (NEW.status = 'CONCLUIDO')
EXECUTE FUNCTION fn_criar_conformidade_por_evento();

COMMENT ON TRIGGER trg_criar_conformidade_por_evento ON conclusao_evento IS
'Gera conformidade ao inserir ou atualizar uma conclusão CONCLUIDO de evento com NR; recalcula a validade pela data de conclusão e pelos meses de reciclagem do catálogo, sem duplicar a conclusão.';

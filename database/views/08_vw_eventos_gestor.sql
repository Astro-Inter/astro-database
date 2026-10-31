CREATE OR REPLACE VIEW vw_eventos_gestor AS
SELECT
    e.id_evento,
    e.gestor_id AS id_gestor,
    e.titulo,
    e.status,
    e.modo_conclusao,
    CASE e.modo_conclusao
        WHEN 'COLABORADOR' THEN COUNT(ce.id_conclusao_evento) FILTER (
            WHERE ce.status = 'PENDENTE'
        )
        WHEN 'GESTOR' THEN COUNT(tc.id_turma_colaborador) FILTER (
            WHERE ce.id_conclusao_evento IS NULL
        )
        ELSE 0::BIGINT
    END AS qtd_pendencias
FROM evento e
LEFT JOIN turma t ON t.evento_id = e.id_evento
LEFT JOIN turma_colaborador tc ON tc.turma_id = t.id_turma
LEFT JOIN conclusao_evento ce ON ce.turma_colaborador_id = tc.id_turma_colaborador
GROUP BY e.id_evento, e.gestor_id, e.titulo, e.status, e.modo_conclusao;

COMMENT ON VIEW vw_eventos_gestor IS
'Lista uma linha por evento com seu gestor criador e a quantidade de pendências de todas as turmas. No modo COLABORADOR, conta conclusões com status PENDENTE. No modo GESTOR, conta participações sem qualquer registro de conclusão, independentemente do status das conclusões existentes. Retorna zero quando não há pendências, inclusive para eventos sem turmas ou participações. Preserva o status do evento, incluindo CONCLUIDO e CANCELADO, sem recalculá-lo nem excluir pendências pelo status. O backend deve filtrar id_gestor conforme o usuário autenticado e seu escopo de acesso.';

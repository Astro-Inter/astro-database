CREATE OR REPLACE FUNCTION fn_carrega_colaboradores(
    p_firebase_uid TEXT
)
RETURNS TABLE (
    id_usuario BIGINT,
    nome VARCHAR(255),
    cargo VARCHAR(255),
    quantidade_pendencias BIGINT
)
LANGUAGE sql
STABLE
AS $$
    WITH contexto AS (
        SELECT u.id_usuario, un.workspace_id
        FROM usuario u
        INNER JOIN unidade un ON un.id_unidade = u.unidade_id
        WHERE u.firebase_uid = p_firebase_uid
          AND NULLIF(BTRIM(p_firebase_uid), '') IS NOT NULL
          AND u.tipo IN ('GESTOR', 'GESTOR_WORKSPACE')
          AND u.status = 'ATIVO'
    ), colaboradores AS (
        SELECT v.id_usuario, v.nome, v.cargo, v.status
        FROM vw_colaboradores v
        INNER JOIN contexto ctx ON ctx.workspace_id = v.workspace_id
        WHERE v.id_usuario <> ctx.id_usuario
          AND v.unidade_id IN (
              SELECT un.id_unidade FROM fn_seleciona_unidades(p_firebase_uid) un
          )
    ), pendencias AS (
        SELECT tc.usuario_id, COUNT(DISTINCT e.id_evento) AS quantidade
        FROM colaboradores c
        INNER JOIN turma_colaborador tc ON tc.usuario_id = c.id_usuario
        INNER JOIN turma t ON t.id_turma = tc.turma_id
        INNER JOIN evento e ON e.id_evento = t.evento_id AND e.status = 'ATIVO'
        INNER JOIN usuario gestor_evento ON gestor_evento.id_usuario = e.gestor_id
        INNER JOIN unidade unidade_gestor ON unidade_gestor.id_unidade = gestor_evento.unidade_id
        INNER JOIN contexto ctx ON ctx.workspace_id = unidade_gestor.workspace_id
        LEFT JOIN conclusao_evento ce ON ce.turma_colaborador_id = tc.id_turma_colaborador
        WHERE c.status = 'ATIVO'
          AND (t.data_termino IS NULL OR t.data_termino >= LOCALTIMESTAMP)
          AND ce.status IS DISTINCT FROM 'CONCLUIDO'
          AND NOT COALESCE(
              ce.status = 'PENDENTE'
              AND ce.data_conclusao IS NOT NULL
              AND ce.data_validacao IS NULL,
              FALSE
          )
        GROUP BY tc.usuario_id
    )
    SELECT c.id_usuario, c.nome, c.cargo, COALESCE(p.quantidade, 0::BIGINT)
    FROM colaboradores c
    LEFT JOIN pendencias p ON p.usuario_id = c.id_usuario
    ORDER BY c.nome, c.id_usuario;
$$;

COMMENT ON FUNCTION fn_carrega_colaboradores(TEXT) IS
'Lista colaboradores do workspace e das unidades permitidas ao GESTOR ou GESTOR_WORKSPACE ativo identificado pelo Firebase UID, excluindo o próprio solicitante. Retorna id_usuario, nome, cargo e quantidade_pendencias, ordenados por nome e ID. Preserva os perfis e status da vw_colaboradores; usuários não ativos são listados com zero pendências. Conta eventos ATIVOS distintos cujo gestor pertence ao mesmo workspace e que tenham ao menos uma participação elegível do colaborador em turma sem término ou com término maior ou igual a LOCALTIMESTAMP, inclusive turmas futuras. Participações CONCLUIDO ou PENDENTE com data_conclusao preenchida e data_validacao nula não contam. Uma participação concluída não elimina a pendência em outra turma do mesmo evento. Datas seguem o fuso da sessão PostgreSQL. UID nulo, vazio, inexistente, inativo ou de outro perfil retorna zero linhas. A API faz o mapeamento dos campos para inglês.';

CREATE OR REPLACE FUNCTION fn_carrega_evento_colaborador(
    p_firebase_uid TEXT,
    p_colaborador_id BIGINT
)
RETURNS TABLE (
    id_colaborador BIGINT,
    nome_colaborador VARCHAR(255),
    id_evento BIGINT,
    titulo_evento VARCHAR(255),
    data_limite_turma TIMESTAMP,
    status_conclusao VARCHAR(50),
    status_evento VARCHAR(50)
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT u.id_usuario, u.nome, e.id_evento, e.titulo,
           t.data_termino, ce.status, e.status
    FROM usuario u
    INNER JOIN unidade un ON un.id_unidade = u.unidade_id
    INNER JOIN turma_colaborador tc ON tc.usuario_id = u.id_usuario
    INNER JOIN turma t ON t.id_turma = tc.turma_id
    INNER JOIN evento e ON e.id_evento = t.evento_id
    LEFT JOIN conclusao_evento ce ON ce.turma_colaborador_id = tc.id_turma_colaborador
    WHERE u.id_usuario = p_colaborador_id
      AND u.tipo IN ('COLABORADOR', 'GESTOR', 'GESTOR_WORKSPACE')
      AND EXISTS (
          SELECT 1
          FROM usuario solicitante
          INNER JOIN unidade origem ON origem.id_unidade = solicitante.unidade_id
          WHERE solicitante.firebase_uid = p_firebase_uid
            AND NULLIF(BTRIM(p_firebase_uid), '') IS NOT NULL
            AND solicitante.tipo IN ('GESTOR', 'GESTOR_WORKSPACE')
            AND solicitante.status = 'ATIVO'
            AND origem.workspace_id = un.workspace_id
      )
      AND u.unidade_id IN (
          SELECT permitida.id_unidade
          FROM fn_seleciona_unidades(p_firebase_uid) permitida
      )
    ORDER BY e.id_evento, t.id_turma, tc.id_turma_colaborador;
$$;

COMMENT ON FUNCTION fn_carrega_evento_colaborador(TEXT, BIGINT) IS
'Lista os eventos do colaborador indicado por ID, restritos ao workspace e às unidades permitidas ao GESTOR ou GESTOR_WORKSPACE ativo identificado pelo Firebase UID. Retorna id_colaborador, nome_colaborador, id_evento, titulo_evento, data_limite_turma, status_conclusao e status_evento, com uma linha por participação em turma e ordenação por evento, turma e participação. Preserva múltiplas turmas do mesmo evento, todos os status do colaborador e do evento, prazos encerrados ou nulos e status_conclusao nulo quando não existe conclusão. Inclui os perfis COLABORADOR, GESTOR e GESTOR_WORKSPACE, permitindo consultar a própria conta. Não restringe eventos ao gestor que os criou. Workspace é derivado do solicitante. Retorna zero linhas para UID ausente, vazio, inexistente, inativo ou de perfil não autorizado, ID nulo ou inexistente, colaborador de outro perfil ou fora do workspace e das unidades autorizadas. O mapeamento para nomes em inglês pertence à API.';

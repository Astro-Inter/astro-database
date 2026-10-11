CREATE OR REPLACE FUNCTION fn_carrega_workspace(
    p_firebase_uid TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT JSONB_BUILD_OBJECT(
        'nome_usuario', u.nome,
        'estatisticas', JSONB_BUILD_OBJECT(
            'quantidade_unidades', est.quantidade_unidades,
            'quantidade_colaboradores', est.quantidade_colaboradores,
            'quantidade_requisitos', est.quantidade_requisitos,
            'quantidade_conformes', est.quantidade_conformes,
            'quantidade_proximos_vencimento', est.quantidade_proximos_vencimento,
            'quantidade_vencidos', est.quantidade_vencidos,
            'quantidade_pendentes', est.quantidade_pendentes,
            'percentual_conformidade_geral', est.percentual_conformidade_geral,
            'data_referencia', est.data_referencia
        )
    )
    FROM usuario u
    INNER JOIN unidade un ON un.id_unidade = u.unidade_id
    INNER JOIN workspace w ON w.id_workspace = un.workspace_id
    INNER JOIN vw_home_estatisticas_gerais est
        ON est.id_workspace = w.id_workspace
    WHERE u.firebase_uid = p_firebase_uid
      AND NULLIF(BTRIM(p_firebase_uid), '') IS NOT NULL
      AND u.tipo IN ('GESTOR_WORKSPACE', 'GESTOR')
      AND u.status = 'ATIVO'
      AND un.ativo = TRUE;
$$;

COMMENT ON FUNCTION fn_carrega_workspace(TEXT) IS
'SCRUM-491: carrega a Home WEB de um GESTOR_WORKSPACE ou GESTOR ativo pelo Firebase UID, vinculado a uma unidade ativa. Retorna JSONB com nome_usuario e estatisticas da vw_home_estatisticas_gerais, restritas ao workspace da unidade do usuário. Preserva as regras da view, incluindo a janela de 30 dias para próximos do vencimento e indicadores zero quando não há dados. Retorna NULL para UID ausente ou vazio, usuário inexistente, inativo, de outro perfil ou vinculado a unidade inativa. A view deve estar criada antes da function. O backend deve fornecer o UID obtido da autenticação validada.';

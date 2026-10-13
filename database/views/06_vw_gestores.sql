CREATE OR REPLACE VIEW vw_gestores AS
SELECT
    u.id_usuario,
    u.nome,
    u.email,
    u.cpf,
    u.modalidade,
    u.status,
    u.cargo_id,
    c.nome AS cargo,
    u.unidade_id,
    un.nome AS unidade,
    un.workspace_id AS workspace_id
FROM usuario u
INNER JOIN cargo c
    ON c.id_cargo = u.cargo_id
INNER JOIN unidade un
    ON un.id_unidade = u.unidade_id
WHERE u.tipo = 'GESTOR';

COMMENT ON VIEW vw_gestores IS
'Reúne os dados de gestores de unidade para listagem, detalhes e edição, incluindo nome, e-mail, CPF, modalidade, status, cargo, unidade e workspace. Retorna uma linha por gestor, permitindo vários gestores na mesma unidade. Mantém gestores pré-cadastrados, ativos e desativados, mesmo quando cargo ou unidade estão inativos. Não inclui colaboradores, gestores de workspace, senha nem Firebase UID. O backend deve restringir todas as consultas pelo workspace e pelo escopo permitido ao solicitante.';

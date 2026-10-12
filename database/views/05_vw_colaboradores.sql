CREATE OR REPLACE VIEW vw_colaboradores AS
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
WHERE u.tipo = 'COLABORADOR';

COMMENT ON VIEW vw_colaboradores IS
'Reúne os dados de colaboradores para listagem, detalhes e edição, incluindo nome, e-mail, CPF, modalidade, status, cargo, unidade e workspace. Mantém colaboradores pré-cadastrados, ativos e desativados, mesmo quando cargo ou unidade estão inativos. Não expõe senha nem Firebase UID. O backend deve restringir todas as consultas pelo workspace e pelas unidades permitidas ao solicitante.';

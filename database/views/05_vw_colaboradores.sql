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
    un.workspace_id AS workspace_id,
    u.tipo
FROM usuario u
INNER JOIN cargo c
    ON c.id_cargo = u.cargo_id
INNER JOIN unidade un
    ON un.id_unidade = u.unidade_id
WHERE u.tipo IN ('COLABORADOR', 'GESTOR', 'GESTOR_WORKSPACE');

COMMENT ON VIEW vw_colaboradores IS
'Reúne os dados de usuários dos tipos COLABORADOR, GESTOR e GESTOR_WORKSPACE como colaboradores para listagem e detalhes, incluindo nome, e-mail, CPF, modalidade, status, cargo, unidade, workspace e tipo do usuário para cálculo das permissões sem junção adicional à tabela usuario. Mantém colaboradores pré-cadastrados, ativos e desativados, mesmo quando cargo ou unidade estão inativos. Não expõe senha nem Firebase UID. As permissões de edição são definidas pelo backend, que deve restringir todas as consultas pelo workspace e pelas unidades permitidas ao solicitante.';

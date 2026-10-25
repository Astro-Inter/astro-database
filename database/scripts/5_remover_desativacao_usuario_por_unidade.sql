-- SCRUM-173: desativar uma unidade não deve alterar o status dos usuários.
-- Aplicar também em bancos que já receberam a trigger e sua função auxiliar.
DROP TRIGGER IF EXISTS trg_desativar_usuario_por_unidade ON unidade;
DROP FUNCTION IF EXISTS fn_desativar_usuario_por_unidade();

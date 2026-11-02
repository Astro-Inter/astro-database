-- Usuário: svc_dashboard
-- Serviço: astro-dashboard-api / Autorização de workspace
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_dashboard LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_dashboard', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_dashboard;

GRANT SELECT (id_usuario, firebase_uid, unidade_id, status, tipo) ON TABLE public.usuario TO svc_dashboard;
GRANT SELECT (id_unidade, workspace_id, ativo) ON TABLE public.unidade TO svc_dashboard;
GRANT SELECT (id_workspace) ON TABLE public.workspace TO svc_dashboard;
GRANT SELECT (firebase_uid) ON TABLE public.admin TO svc_dashboard;
GRANT EXECUTE ON FUNCTION public.fn_retornar_nivel_acesso(text) TO svc_dashboard;
COMMIT;

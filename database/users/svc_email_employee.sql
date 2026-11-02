-- Usuário: svc_email_employee
-- Serviço: astro-email-worker / Colaboradores; Worker Cloudflare combinado
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_email_employee LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_email_employee', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_email_employee;

GRANT SELECT (id_usuario, nome, email, status, tipo, unidade_id, cargo_id) ON TABLE public.usuario TO svc_email_employee;
GRANT SELECT (id_unidade, nome, workspace_id) ON TABLE public.unidade TO svc_email_employee;
GRANT SELECT (id_workspace, nome) ON TABLE public.workspace TO svc_email_employee;
GRANT SELECT (id_cargo, nome) ON TABLE public.cargo TO svc_email_employee;
COMMIT;

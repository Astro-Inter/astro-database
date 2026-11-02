-- Usuário: svc_cleanup
-- Serviço: astro-data-cleanup / Reconciliação Firebase
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_cleanup LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_cleanup', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_cleanup;

GRANT SELECT (firebase_uid) ON TABLE public.conta TO svc_cleanup;
COMMIT;

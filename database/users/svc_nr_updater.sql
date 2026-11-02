-- Usuário: svc_nr_updater
-- Serviço: nr-updater / Atualização catálogo NRs
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_nr_updater LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_nr_updater', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_nr_updater;

GRANT SELECT (codigo_nr, titulo, revogada, tempo_reciclagem_mes), INSERT (codigo_nr, titulo, revogada, tempo_reciclagem_mes), UPDATE (titulo, revogada, tempo_reciclagem_mes) ON TABLE public.nr_catalogo TO svc_nr_updater;
GRANT EXECUTE ON PROCEDURE public.ler_json_nr(text) TO svc_nr_updater;
COMMIT;

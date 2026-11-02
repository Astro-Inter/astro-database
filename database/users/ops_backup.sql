-- Usuário: ops_backup
-- Serviço: postgresql-backup / Backup integral
-- Hospedagem: GitHub Actions
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE ops_backup LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO ops_backup', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO ops_backup;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO ops_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ops_backup;
-- Schema opcional instalado pelo Medallion. O backup integral inclui-o quando existir.
DO $backup$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'astro_api') THEN
    GRANT USAGE ON SCHEMA astro_api TO ops_backup;
    GRANT SELECT ON ALL TABLES IN SCHEMA astro_api TO ops_backup;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA astro_api TO ops_backup;
  END IF;
END;
$backup$;
COMMIT;

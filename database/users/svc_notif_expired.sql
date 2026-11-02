-- Usuário: svc_notif_expired
-- Serviço: astro-notification-service / expired-compliance
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_notif_expired LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_notif_expired', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_notif_expired;

GRANT SELECT (id_conformidade, usuario_id, nr_id, aplicavel, data_validade) ON TABLE public.conformidade TO svc_notif_expired;
GRANT SELECT (id_usuario, cargo_id, unidade_id, tipo, status) ON TABLE public.usuario TO svc_notif_expired;
GRANT SELECT (id_unidade, workspace_id, ativo) ON TABLE public.unidade TO svc_notif_expired;
GRANT SELECT (id_cargo, workspace_id, ativo) ON TABLE public.cargo TO svc_notif_expired;
GRANT SELECT (codigo_nr, revogada) ON TABLE public.nr_catalogo TO svc_notif_expired;
COMMIT;

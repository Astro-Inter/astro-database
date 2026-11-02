-- Usuário: svc_notif_pending
-- Serviço: astro-notification-service / pending-validations
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_notif_pending LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_notif_pending', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_notif_pending;

GRANT SELECT (id_turma_colaborador, turma_id, usuario_id) ON TABLE public.turma_colaborador TO svc_notif_pending;
GRANT SELECT (id_turma, evento_id) ON TABLE public.turma TO svc_notif_pending;
GRANT SELECT (id_evento, gestor_id, titulo, status) ON TABLE public.evento TO svc_notif_pending;
GRANT SELECT (id_usuario, cargo_id, unidade_id, tipo, status) ON TABLE public.usuario TO svc_notif_pending;
GRANT SELECT (id_unidade, workspace_id, ativo) ON TABLE public.unidade TO svc_notif_pending;
GRANT SELECT (id_cargo, workspace_id, ativo) ON TABLE public.cargo TO svc_notif_pending;
GRANT SELECT (id_conclusao_evento, turma_colaborador_id, status, data_conclusao, data_validacao) ON TABLE public.conclusao_evento TO svc_notif_pending;
COMMIT;

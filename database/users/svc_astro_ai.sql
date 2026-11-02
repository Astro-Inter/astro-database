-- Usuário: svc_astro_ai
-- Serviço: astro-ai-api / API IA, ferramentas e autorização
-- Hospedagem: AWS
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_astro_ai LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_astro_ai', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_astro_ai;
ALTER ROLE svc_astro_ai SET default_transaction_read_only = on;

GRANT SELECT (nome, email, firebase_uid) ON TABLE public.admin TO svc_astro_ai;
GRANT SELECT ON TABLE public.usuario TO svc_astro_ai;
GRANT SELECT ON TABLE public.cargo TO svc_astro_ai;
GRANT SELECT ON TABLE public.unidade TO svc_astro_ai;
GRANT SELECT ON TABLE public.workspace TO svc_astro_ai;
GRANT SELECT ON TABLE public.unidade_endereco TO svc_astro_ai;
GRANT SELECT ON TABLE public.cargo_nr TO svc_astro_ai;
GRANT SELECT ON TABLE public.unidade_nr TO svc_astro_ai;
GRANT SELECT ON TABLE public.nr_catalogo TO svc_astro_ai;
GRANT SELECT ON TABLE public.conformidade TO svc_astro_ai;
GRANT SELECT ON TABLE public.turma_colaborador TO svc_astro_ai;
GRANT SELECT ON TABLE public.turma TO svc_astro_ai;
GRANT SELECT ON TABLE public.evento TO svc_astro_ai;
GRANT SELECT ON TABLE public.conclusao_evento TO svc_astro_ai;
GRANT SELECT ON TABLE public.acesso TO svc_astro_ai;
GRANT SELECT (conclusao_evento_id) ON TABLE public.evidencia TO svc_astro_ai;
GRANT SELECT ON TABLE public.usuario_foto_perfil TO svc_astro_ai;
GRANT SELECT ON TABLE public.vw_conformidade_colaborador TO svc_astro_ai;
GRANT SELECT ON TABLE public.vw_unidades TO svc_astro_ai;
GRANT EXECUTE ON FUNCTION public.fn_retornar_nivel_acesso(text) TO svc_astro_ai;
GRANT EXECUTE ON FUNCTION public.fn_seleciona_unidades(text) TO svc_astro_ai;
COMMIT;

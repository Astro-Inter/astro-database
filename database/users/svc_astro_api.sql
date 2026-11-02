-- Usuário: svc_astro_api
-- Serviço: astro-api / API Java
-- Hospedagem: AWS
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_astro_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_astro_api', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_astro_api;

GRANT SELECT, INSERT ON TABLE public.workspace TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.cargo TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.unidade TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.unidade_endereco TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.usuario TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.usuario_foto_perfil TO svc_astro_api;
GRANT SELECT ON TABLE public.nr_catalogo TO svc_astro_api;
GRANT SELECT, INSERT, DELETE ON TABLE public.cargo_nr TO svc_astro_api;
GRANT SELECT, INSERT, DELETE ON TABLE public.unidade_nr TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.evento TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.turma TO svc_astro_api;
GRANT SELECT, INSERT, DELETE ON TABLE public.turma_colaborador TO svc_astro_api;
-- Lock FOR SHARE do trigger de validação de conclusões.
GRANT UPDATE (id_turma_colaborador) ON TABLE public.turma_colaborador TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.conclusao_evento TO svc_astro_api;
GRANT SELECT, INSERT, DELETE ON TABLE public.evidencia TO svc_astro_api;
GRANT SELECT, INSERT, UPDATE ON TABLE public.conformidade TO svc_astro_api;
GRANT SELECT (data, firebase_uid), INSERT (data, firebase_uid) ON TABLE public.acesso TO svc_astro_api;
GRANT SELECT (id_admin, email, firebase_uid) ON TABLE public.admin TO svc_astro_api;
GRANT UPDATE (codigo_nr) ON TABLE public.nr_catalogo TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_gestores TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_colaboradores TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_conformidade_colaborador TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_conformidade_unidade TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_eventos_gestor TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_cargos TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_unidades TO svc_astro_api;
GRANT SELECT ON TABLE public.vw_home_estatisticas_gerais TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_retornar_nivel_acesso(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_retornar_tipo_conta(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_registrar_acesso_diario(character varying) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_carrega_home_colaborador(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_carrega_home_gestor(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_carrega_workspace(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_seleciona_cargos(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_seleciona_cargo_nrs(text, bigint) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_altera_status_cargo(text, bigint) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_altera_cargo(text, bigint, text, text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_seleciona_unidades(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_seleciona_unidade_nrs(text, bigint) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_altera_status_unidade(text, bigint) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_seleciona_candidatos_evento(text, integer) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_carrega_colaboradores(text) TO svc_astro_api;
GRANT EXECUTE ON FUNCTION public.fn_carrega_evento_colaborador(text, bigint) TO svc_astro_api;
GRANT EXECUTE ON PROCEDURE public.pr_inseri_cargo(text, text, text) TO svc_astro_api;
GRANT EXECUTE ON PROCEDURE public.pr_alterar_cargo_nrs(text, bigint, jsonb) TO svc_astro_api;
GRANT EXECUTE ON PROCEDURE public.pr_alterar_unidade_nrs(text, bigint, jsonb) TO svc_astro_api;
DO $sequences$
DECLARE relation_name text; sequence_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['public.workspace', 'public.cargo', 'public.unidade', 'public.usuario', 'public.evento', 'public.turma', 'public.turma_colaborador', 'public.conclusao_evento', 'public.evidencia', 'public.conformidade'] LOOP
    sequence_name := pg_get_serial_sequence(relation_name, 'id_' || split_part(relation_name, '.', 2));
    IF sequence_name IS NULL THEN
      RAISE EXCEPTION 'Sequence não localizada para %. Confirmar o DDL instalado.', relation_name;
    END IF;
    EXECUTE format('GRANT USAGE ON SEQUENCE %s TO svc_astro_api', sequence_name);
  END LOOP;
END;
$sequences$;
COMMIT;

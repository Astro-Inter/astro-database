-- Usuário: svc_rpa_target
-- Serviço: data-integration-rpa / Destino Astro
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_rpa_target LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_rpa_target', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_rpa_target;

GRANT SELECT (id_workspace, cnpj, nome), INSERT (nome, cnpj), UPDATE (nome) ON TABLE public.workspace TO svc_rpa_target;
GRANT SELECT (id_cargo, workspace_id, nome), INSERT (workspace_id, nome, ativo) ON TABLE public.cargo TO svc_rpa_target;
GRANT SELECT (id_unidade, workspace_id, nome), INSERT (workspace_id, nome, ativo) ON TABLE public.unidade TO svc_rpa_target;
GRANT SELECT (id_usuario, cpf, email, firebase_uid, cargo_id, unidade_id), INSERT (nome, email, cpf, firebase_uid, cargo_id, unidade_id, tipo, status), UPDATE (nome, email, cpf, firebase_uid, cargo_id, unidade_id) ON TABLE public.usuario TO svc_rpa_target;
GRANT SELECT (email, firebase_uid) ON TABLE public.admin TO svc_rpa_target;
GRANT SELECT (email, firebase_uid) ON TABLE public.conta TO svc_rpa_target;
DO $sequences$
DECLARE relation_name text; sequence_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['public.workspace', 'public.cargo', 'public.unidade', 'public.usuario'] LOOP
    sequence_name := pg_get_serial_sequence(relation_name, 'id_' || split_part(relation_name, '.', 2));
    IF sequence_name IS NULL THEN
      RAISE EXCEPTION 'Sequence não localizada para %. Confirmar o DDL instalado.', relation_name;
    END IF;
    EXECUTE format('GRANT USAGE ON SEQUENCE %s TO svc_rpa_target', sequence_name);
  END LOOP;
END;
$sequences$;
COMMIT;

-- OPCIONAL: Fallback com controle SQL
-- Somente quando o processo não recebe FirestoreState e as tabelas rpa_* estiverem instaladas.
-- GRANT SELECT, INSERT, UPDATE ON TABLE public.rpa_sync_control, public.rpa_sync_users TO svc_rpa_target;
-- GRANT SELECT, INSERT ON TABLE public.rpa_user_links TO svc_rpa_target;

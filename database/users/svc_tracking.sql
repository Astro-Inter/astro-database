-- Usuário: svc_tracking
-- Serviço: astro-tracking-api / Coleta de eventos de navegação
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_tracking LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_tracking', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_tracking;

GRANT INSERT (firebase_uid, tipo_evento, nome_botao, nome_tela, contexto_tela, nome_dialog, dialog_clicado, showcase_click, nome_showcase, cliente_ip, criado_em), SELECT (id_evento, firebase_uid, tipo_evento, nome_botao, nome_tela, contexto_tela, nome_dialog, dialog_clicado, showcase_click, nome_showcase, cliente_ip, criado_em) ON TABLE public.evento_astro TO svc_tracking;
DO $sequences$
DECLARE relation_name text; sequence_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['public.evento_astro'] LOOP
    sequence_name := pg_get_serial_sequence(relation_name, 'id_evento');
    IF sequence_name IS NULL THEN
      RAISE EXCEPTION 'Sequence não localizada para %. Confirmar o DDL instalado.', relation_name;
    END IF;
    EXECUTE format('GRANT USAGE ON SEQUENCE %s TO svc_tracking', sequence_name);
  END LOOP;
END;
$sequences$;
COMMIT;

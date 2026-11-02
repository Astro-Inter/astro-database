-- Usuário: svc_medallion
-- Serviço: astro-medallion-api / API e captura Bronze/Silver/Gold
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco ASTRO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_medallion LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_medallion', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_medallion;

GRANT SELECT (nome, id_unidade) ON TABLE public.unidade TO svc_medallion;
GRANT SELECT (unidade_id, rua, numero, cidade, bairro, estado, complemento, geolocalizacao) ON TABLE public.unidade_endereco TO svc_medallion;
GRANT SELECT (id_usuario, unidade_id, cargo_id, tipo, status, nome) ON TABLE public.usuario TO svc_medallion;
GRANT SELECT (codigo_nr, id_unidade, id_dim_nr_catalogo) ON TABLE public.dim_nr_catalogo TO svc_medallion;
GRANT SELECT (usuario_id, turma_id, id_turma_colaborador) ON TABLE public.turma_colaborador TO svc_medallion;
GRANT SELECT (id_turma, data_inicial, evento_id) ON TABLE public.turma TO svc_medallion;
GRANT SELECT (status, turma_colaborador_id, id_conclusao_evento, data_conclusao, data_validacao) ON TABLE public.conclusao_evento TO svc_medallion;
GRANT SELECT (id_conformidade, nr_id, conclusao_evento_id) ON TABLE public.conformidade TO svc_medallion;
GRANT SELECT (status, id_evento, gestor_id, nr_id, modo_conclusao) ON TABLE public.evento TO svc_medallion;
GRANT SELECT (id_evento, firebase_uid, tipo_evento, nome_botao, nome_tela, contexto_tela, nome_dialog, dialog_clicado, showcase_click, nome_showcase, cliente_ip, criado_em) ON TABLE public.evento_astro TO svc_medallion;
GRANT SELECT (nr_id, cargo_id) ON TABLE public.cargo_nr TO svc_medallion;
GRANT SELECT (id_cargo, nome) ON TABLE public.cargo TO svc_medallion;
GRANT SELECT ON TABLE astro_api.history_control TO svc_medallion;
GRANT SELECT ON TABLE astro_api.usuario_history TO svc_medallion;
GRANT SELECT, INSERT, DELETE ON TABLE astro_api.snapshots TO svc_medallion;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE astro_api.rate_buckets TO svc_medallion;
GRANT USAGE ON SCHEMA astro_api TO svc_medallion;
GRANT USAGE ON SEQUENCE astro_api.fact_id_seq TO svc_medallion;
COMMIT;

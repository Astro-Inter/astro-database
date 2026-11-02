-- Usuário: svc_rpa_legacy
-- Serviço: data-integration-rpa / Origem legado
-- Hospedagem: Cloudflare
-- Proposta baseada na análise de 02/11/2026; conferir objetos/ACLs no ambiente alvo.
-- Executar como administrador no banco LEGADO correto. Não contém senha.
-- Após criar, definir autenticação por canal seguro e atualizar o secret/Hyperdrive.
-- Não revoga privilégios existentes de PUBLIC ou de outras roles.
BEGIN;
CREATE ROLE svc_rpa_legacy LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $connection$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO svc_rpa_legacy', current_database());
END;
$connection$;
GRANT USAGE ON SCHEMA public TO svc_rpa_legacy;

GRANT SELECT (id_funcionario, cpf, nome, cargo, id_empresa, id_departamento) ON TABLE public.funcionario TO svc_rpa_legacy;
GRANT SELECT (id_empresa, nome, cnpj) ON TABLE public.empresa TO svc_rpa_legacy;
GRANT SELECT (id_departamento, nome, id_empresa) ON TABLE public.departamento TO svc_rpa_legacy;
COMMIT;

-- OPCIONAL: Legado com e-mail inline
-- Aplicar somente se funcionario possuir a coluna email.
-- GRANT SELECT (email) ON TABLE public.funcionario TO svc_rpa_legacy;

-- OPCIONAL: Legado com tabela de e-mails
-- Aplicar somente se os e-mails estiverem em tabela separada.
-- GRANT SELECT (id_funcionario, id_email, email) ON TABLE public.email TO svc_rpa_legacy;

-- OPCIONAL: CPF criptografado em bytea
-- Se pgcrypto estiver instalado em outro schema, ajustar a assinatura. A chave não pertence a este catálogo.
-- GRANT EXECUTE ON FUNCTION public.pgp_sym_decrypt(bytea, text) TO svc_rpa_legacy;

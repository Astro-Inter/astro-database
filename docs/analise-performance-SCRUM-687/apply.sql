-- executar fora de transação; não usar o executor transacional do workspace.
SET lock_timeout = '3s';
SET statement_timeout = '60s';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conformidade_usuario_nr_ordem
ON public.conformidade (usuario_id, nr_id, aplicavel DESC, data_validade DESC NULLS LAST, id_conformidade DESC);
COMMENT ON INDEX public.idx_conformidade_usuario_nr_ordem IS 'Busca representativa por usuario e NR; atende aplicavel = TRUE e IS TRUE sem Sort.';
SELECT indexrelid::regclass, indisvalid, indisready, pg_relation_size(indexrelid) FROM pg_index WHERE indexrelid='public.idx_conformidade_usuario_nr_ordem'::regclass;

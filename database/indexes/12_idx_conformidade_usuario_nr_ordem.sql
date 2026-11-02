CREATE INDEX IF NOT EXISTS idx_conformidade_usuario_nr_ordem
ON public.conformidade (usuario_id, nr_id, aplicavel DESC, data_validade DESC NULLS LAST, id_conformidade DESC);

COMMENT ON INDEX public.idx_conformidade_usuario_nr_ordem IS
'Busca representativa por usuario e NR; atende aplicavel = TRUE e IS TRUE sem Sort. Evidencias na analise de performance.';

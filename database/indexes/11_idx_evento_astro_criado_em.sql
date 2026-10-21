CREATE INDEX IF NOT EXISTS idx_evento_astro_criado_em
    ON public.evento_astro (criado_em DESC, id_evento DESC);

COMMENT ON INDEX public.idx_evento_astro_criado_em IS
'Otimiza a consulta dos eventos da aplicação web do Astro do mais recente para o mais antigo.';

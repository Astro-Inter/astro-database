-- executar fora de transação. Remove somente o índice desta tarefa.
SET lock_timeout = '3s';
SET statement_timeout = '60s';
DROP INDEX CONCURRENTLY IF EXISTS public.idx_conformidade_usuario_nr_ordem;

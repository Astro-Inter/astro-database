CREATE INDEX idx_conformidade_unidade_nr
ON conformidade (unidade_id, nr_id, aplicavel DESC, data_validade DESC NULLS LAST, id_conformidade DESC)
WHERE tipo = 'UNIDADE';

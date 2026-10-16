-- Pode ser executado isoladamente em bancos existentes ou após os scripts estruturais.
-- O bloco mantém a conversão dos dados e a troca da constraint na mesma transação.
DO $$
BEGIN
    LOCK TABLE evento IN ACCESS EXCLUSIVE MODE;

    UPDATE evento
    SET modo_conclusao = 'GESTOR'
    WHERE modo_conclusao = 'LISTA_PRESENCA';

    ALTER TABLE evento
        DROP CONSTRAINT IF EXISTS ck_evento_modo_conclusao;

    ALTER TABLE evento
        ADD CONSTRAINT ck_evento_modo_conclusao CHECK (
            modo_conclusao IN ('COLABORADOR', 'GESTOR')
        );

    COMMENT ON COLUMN evento.modo_conclusao IS
        'Forma pela qual a participação será concluída: COLABORADOR ou GESTOR.';
END;
$$;

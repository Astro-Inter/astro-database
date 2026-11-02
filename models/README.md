# Modelos

Adicione aqui as imagens configuradas em `database-workspace.config.json`:

- `conceitual.png`
- `logico.png`

O modelo conceitual também possui a fonte editável `conceitual.svg`. Seus conectores são separados por relacionamento, com cardinalidades junto aos extremos e pontes para indicar cruzamentos sem ligação. Ao editar essa fonte, atualize também `conceitual.png`, que é a imagem exibida no site.

A V1 apenas apresenta os modelos fornecidos; ela não os gera automaticamente.

Para usar outros nomes ou formatos aceitos pelo navegador, altere somente:

```json
"models": {
  "conceptual": "models/nome-do-arquivo.png",
  "logical": "models/outro-arquivo.png"
}
```

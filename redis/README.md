# Redis no Astro

Redis mantém filas de envio de e-mail, códigos de acesso, visualizações individuais, contadores de mensagens não lidas, deduplicação de mensagens, cache de fotos e controle de frequência de digitação. Canais Pub/Sub distribuem eventos entre instâncias da API.

As filas desacoplam SMTP das requisições. Os conjuntos de visualização preservam o estado por usuário; a deduplicação evita contar a mesma mensagem duas vezes. Os contadores alimentam a lista de conversas. O cache reduz consultas e assinaturas de links R2, e o limite de digitação reduz tráfego. Redis participa do comportamento funcional: não é somente um cache descartável.

PostgreSQL mantém os cadastros, MongoDB guarda conversas e mensagens e R2 armazena arquivos. Redis não substitui essas origens nem participa de uma transação distribuída com elas. Pub/Sub não é uma fila durável.

## Catálogo e fluxos

- `keys/*.json`: uma definição por família, com nome, tipo, finalidade, prazo, produtores, consumidores, comandos, estrutura, exemplos fictícios, limites e evidências de código.
- `docs/modeling.json`: importância do Redis, responsabilidades, decisões pendentes e seis fluxos operacionais.
- `analyzer/redis/`: validação de String, List, Set e Pub/Sub e geração de `generated/redis.json`.
- `site/components/redis/`: catálogo, busca, fluxos e decisões apresentados pelo site.

Os segmentos das chaves usam português sem acentos, preservando workspace como exceção; IDs e e-mails não são traduzidos. Os campos dos documentos deste catálogo e os contratos Java/HTTP continuam em inglês. Canais Pub/Sub não são chaves armazenadas e não aparecem em SCAN.

API e worker precisam concordar nos prefixos `ACCESS_TOKEN_PREFIX` e `WORKSPACE_ACCESS_TOKEN_PREFIX`. O worker deve configurar `REDIS_QUEUE_KEY=processamento:email:colaborador` e `WORKSPACE_EMAIL_QUEUE_KEY=processamento:email:workspace`. Os prefixos de código constam no catálogo; as variáveis mantêm seus nomes existentes.

## Base da revisão

Contratos conferidos no código da API Astro e do astro-email-worker em 30/10/2026. O catálogo tem 14 contratos implementados no código e duas propostas (sessão de chatbot e cache genérico). Esse estado não confirma implantação ou configuração de produção. Não foi localizado ranking Redis.

O levantamento anterior descrevia IDs nas filas de colaboradores e tokens por ID. O código atual usa e-mails normalizados em ambos. A validação dos códigos está em `UserService.verifyAccessKey`; ela compara o valor sem removê-lo. O código de workspace continua sem TTL no worker. As limitações de entrega, retenção e produtores não localizados estão em Decisões de uso.

Este módulo documenta contratos; não conecta ao Redis nem executa os comandos dos exemplos. Nenhuma credencial, código real ou dado pessoal foi copiado. Para validar, use `node --test test/redis.test.js`; para gerar o site, use `npm run build`.

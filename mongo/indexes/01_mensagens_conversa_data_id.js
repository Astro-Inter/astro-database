const collection = db.getCollection("mensagens");
const name = "idx_mensagens_conversa_data_id";
const keys = { conversa_id: 1, data: -1, _id: -1 };
const existing = collection.getIndexes().find(index => index.name === name);
if (existing && (JSON.stringify(existing.key) !== JSON.stringify(keys) || existing.unique || existing.expireAfterSeconds !== undefined || existing.hidden || existing.partialFilterExpression)) {
  throw new Error("O índice existente tem uma definição diferente da esperada.");
}
collection.createIndex(keys, { name });
printjson(collection.getIndexes().filter(index => index.name === name));

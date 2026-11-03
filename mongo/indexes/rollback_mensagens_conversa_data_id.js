const collection = db.getCollection("mensagens");
const name = "idx_mensagens_conversa_data_id";
const expected = { conversa_id: 1, data: -1, _id: -1 };
const existing = collection.getIndexes().find(index => index.name === name);
if (existing && JSON.stringify(existing.key) !== JSON.stringify(expected)) {
  throw new Error("A definição do índice mudou; revise antes de remover.");
}
if (existing) collection.dropIndex(name);

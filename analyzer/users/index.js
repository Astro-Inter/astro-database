import fs from 'node:fs/promises';
import path from 'node:path';
import { workspaceRoot } from '../config.js';

/** Catálogo documental: scripts de acesso não entram no executor de migrações. */
export async function analyzeUsers({ root = workspaceRoot, generated = 'generated', write = true } = {}) {
  const catalog = JSON.parse(await fs.readFile(path.join(root, 'database/users/catalog.json'), 'utf8'));
  const names = new Set();
  const users = await Promise.all(catalog.users.map(async (user) => {
    if (!/^[a-z][a-z0-9_]*$/.test(user.name) || names.has(user.name)) throw new Error(`Usuário inválido ou duplicado: ${user.name}`);
    names.add(user.name);
    if (user.file !== `database/users/${user.name}.sql`) throw new Error(`Caminho inválido para ${user.name}`);
    return { ...user, sql: await fs.readFile(path.join(root, user.file), 'utf8') };
  }));
  const result = { ...catalog, users };
  if (write) {
    await fs.mkdir(path.join(root, generated), { recursive: true });
    await fs.writeFile(path.join(root, generated, 'postgresql-users.json'), JSON.stringify(result, null, 2) + '\n');
  }
  return result;
}

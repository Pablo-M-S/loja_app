// Usamos lowdb (v1) porque grava tudo em um arquivo JSON simples.
// Isso evita precisar compilar módulos nativos (como sqlite3) no Termux.
// Quando formos pra produção na nuvem, trocamos isso por Postgres (Railway/Render/Supabase).

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Em produção no Railway, o volume injeta a variável RAILWAY_VOLUME_MOUNT_PATH
// automaticamente (ex: "/data"), e o db.json passa a viver lá dentro,
// sobrevivendo a redeploys. Localmente (Codespace, sem volume), essa variável
// não existe, então cai no comportamento antigo (arquivo ao lado do db.js).
const dbDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const dbPath = path.join(dbDir, 'db.json');

console.log('[db] Usando arquivo de banco em:', dbPath);

const adapter = new FileSync(dbPath);
const db = low(adapter);

// Estrutura inicial do banco, caso o arquivo ainda não exista
db.defaults({
  categories: [],
  products: [],
  customers: [],
  admins: []
}).write();

module.exports = db;

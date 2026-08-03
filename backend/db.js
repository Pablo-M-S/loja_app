// db.js
// Usamos lowdb (v1) porque grava tudo em um arquivo JSON simples.
// Isso evita precisar compilar módulos nativos (como sqlite3) no Termux.
// Quando formos pra produção na nuvem, trocamos isso por Postgres (Railway/Render/Supabase).

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Estrutura inicial do banco, caso o arquivo ainda não exista
db.defaults({
  categories: [],
  products: [],
  customers: [],
  admins: []
}).write();

module.exports = db;

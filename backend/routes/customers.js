const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db');

// Validação bem simples de CPF (formato + dígitos verificadores)
// Isso evita cadastro de CPFs claramente inválidos, mas não substitui
// validação oficial (Receita Federal) que você vai querer no futuro.
function cpfValido(cpf) {
  cpf = String(cpf).replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[10])) return false;

  return true;
}

// POST /api/customers - cadastro de cliente
router.post('/', (req, res) => {
  const { nome, cpf, email, endereco, googleId } = req.body;

  if (!nome || !cpf) {
    return res.status(400).json({ erro: 'nome e cpf são obrigatórios' });
  }
  if (!cpfValido(cpf)) {
    return res.status(400).json({ erro: 'CPF inválido' });
  }

  const cpfLimpo = String(cpf).replace(/[^\d]/g, '');
  const existente = db.get('customers').find({ cpf: cpfLimpo }).value();
  if (existente) {
    return res.status(409).json({ erro: 'Já existe um cliente cadastrado com esse CPF' });
  }

  // endereco esperado: { cep, rua, numero, complemento, bairro, cidade, estado }
  const novoCliente = {
    id: uuid(),
    nome,
    cpf: cpfLimpo,
    email: email || null,
    googleId: googleId || null,
    endereco: endereco || null,
    criadoEm: new Date().toISOString()
  };

  db.get('customers').push(novoCliente).write();
  res.status(201).json(novoCliente);
});

// GET /api/customers/by-cpf/:cpf - busca cliente pelo CPF (usado como "login")
// Precisa vir ANTES de /:id, senão o Express trata "by-cpf" como se fosse um id.
router.get('/by-cpf/:cpf', (req, res) => {
  const cpfLimpo = String(req.params.cpf).replace(/[^\d]/g, '');
  const cliente = db.get('customers').find({ cpf: cpfLimpo }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const cliente = db.get('customers').find({ id: req.params.id }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

// PUT /api/customers/:id - atualizar endereço/dados
router.put('/:id', (req, res) => {
  const cliente = db.get('customers').find({ id: req.params.id });
  if (!cliente.value()) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const camposPermitidos = ['nome', 'email', 'endereco'];
  const atualizacoes = {};
  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) atualizacoes[campo] = req.body[campo];
  }

  cliente.assign(atualizacoes).write();
  res.json(cliente.value());
});

module.exports = router;

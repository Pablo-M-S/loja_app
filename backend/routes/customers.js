const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
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

// Remove o hash da senha antes de devolver o cliente pro app.
// Nunca deixamos esse campo vazar nas respostas da API.
function semSenha(cliente) {
  if (!cliente) return cliente;
  const { senha, ...resto } = cliente;
  return resto;
}

// POST /api/customers - cadastro de cliente
router.post('/', async (req, res) => {
  const { nome, cpf, senha, email, endereco, googleId } = req.body;

  if (!nome || !cpf) {
    return res.status(400).json({ erro: 'nome e cpf são obrigatórios' });
  }
  if (!cpfValido(cpf)) {
    return res.status(400).json({ erro: 'CPF inválido' });
  }
  if (!senha || senha.length < 6) {
    return res.status(400).json({ erro: 'senha é obrigatória e deve ter pelo menos 6 caracteres' });
  }

  const cpfLimpo = String(cpf).replace(/[^\d]/g, '');
  const existente = db.get('customers').find({ cpf: cpfLimpo }).value();
  if (existente) {
    return res.status(409).json({ erro: 'Já existe um cliente cadastrado com esse CPF' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  // endereco esperado: { cep, rua, numero, complemento, bairro, cidade, estado }
  const novoCliente = {
    id: uuid(),
    nome,
    cpf: cpfLimpo,
    senha: senhaHash,
    email: email || null,
    googleId: googleId || null,
    endereco: endereco || null,
    criadoEm: new Date().toISOString()
  };

  db.get('customers').push(novoCliente).write();
  res.status(201).json(semSenha(novoCliente));
});

// POST /api/customers/login - autentica com CPF + senha
// Precisa vir ANTES de /:id, senão o Express trata "login" como se fosse um id.
router.post('/login', async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ erro: 'cpf e senha são obrigatórios' });
  }

  const cpfLimpo = String(cpf).replace(/[^\d]/g, '');
  const cliente = db.get('customers').find({ cpf: cpfLimpo }).value();

  // Mensagem genérica de propósito — não revela se o erro foi CPF ou senha,
  // isso dificulta que alguém descubra quais CPFs estão cadastrados.
  if (!cliente) {
    return res.status(401).json({ erro: 'CPF ou senha incorretos' });
  }

  const senhaCorreta = await bcrypt.compare(senha, cliente.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'CPF ou senha incorretos' });
  }

  res.json(semSenha(cliente));
});

// GET /api/customers/by-cpf/:cpf
// Mantido só para compatibilidade — não é mais usado como login (sem senha).
router.get('/by-cpf/:cpf', (req, res) => {
  const cpfLimpo = String(req.params.cpf).replace(/[^\d]/g, '');
  const cliente = db.get('customers').find({ cpf: cpfLimpo }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(semSenha(cliente));
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const cliente = db.get('customers').find({ id: req.params.id }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(semSenha(cliente));
});

// PUT /api/customers/:id - atualizar dados (nome, email, endereço)
router.put('/:id', (req, res) => {
  const cliente = db.get('customers').find({ id: req.params.id });
  if (!cliente.value()) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const camposPermitidos = ['nome', 'email', 'endereco'];
  const atualizacoes = {};
  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) atualizacoes[campo] = req.body[campo];
  }

  cliente.assign(atualizacoes).write();
  res.json(semSenha(cliente.value()));
});
// DELETE /api/customers/:id - remove um cliente (uso administrativo/testes)
router.delete('/:id', (req, res) => {
  const cliente = db.get('customers').find({ id: req.params.id }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  db.get('customers').remove({ id: req.params.id }).write();
  res.json({ sucesso: true, mensagem: 'Cliente removido' });
});

module.exports = router;

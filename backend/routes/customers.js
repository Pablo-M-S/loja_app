const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../db');

// Lista dos municípios da Grande São Paulo (Região Metropolitana),
// usada para calcular automaticamente a zona de entrega pela cidade.
const GRANDE_SP = [
  'sao paulo', 'guarulhos', 'osasco', 'santo andre', 'sao bernardo do campo',
  'sao caetano do sul', 'diadema', 'maua', 'ribeirao pires', 'rio grande da serra',
  'barueri', 'carapicuiba', 'cotia', 'embu das artes', 'embu-guacu',
  'itapecerica da serra', 'itapevi', 'jandira', 'juquitiba', 'pirapora do bom jesus',
  'santana de parnaiba', 'taboao da serra', 'vargem grande paulista',
  'francisco morato', 'franco da rocha', 'caieiras', 'cajamar', 'mairipora',
  'guararema', 'aruja', 'biritiba-mirim', 'ferraz de vasconcelos',
  'itaquaquecetuba', 'mogi das cruzes', 'poa', 'salesopolis', 'suzano'
];

// Remove acentos e deixa minúsculo, pra comparar cidade sem depender de digitação exata.
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Calcula a zona de entrega a partir da cidade informada no endereço.
function calcularZonaEntrega(cidade) {
  if (!cidade) return null;
  return GRANDE_SP.includes(normalizar(cidade)) ? 'grande_sp' : 'fora_da_capital';
}

// Validação bem simples de CPF (formato + dígitos verificadores).
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

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

// Remove o hash da senha antes de devolver o cliente pro app.
function semSenha(cliente) {
  if (!cliente) return cliente;
  const { senha, ...resto } = cliente;
  return resto;
}

// POST /api/customers - cadastro de cliente
// Login agora é feito por e-mail + senha. CPF e endereço são dados de perfil,
// opcionais no momento do cadastro (podem ser preenchidos depois no Perfil).
router.post('/', async (req, res) => {
  const { nome, email, senha, cpf, endereco, googleId } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'nome, email e senha são obrigatórios' });
  }
  if (!emailValido(email)) {
    return res.status(400).json({ erro: 'e-mail inválido' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'senha deve ter pelo menos 6 caracteres' });
  }

  const emailLimpo = String(email).trim().toLowerCase();
  const existente = db.get('customers').find({ email: emailLimpo }).value();
  if (existente) {
    return res.status(409).json({ erro: 'Já existe um cadastro com esse e-mail' });
  }

  let cpfLimpo = null;
  if (cpf) {
    if (!cpfValido(cpf)) {
      return res.status(400).json({ erro: 'CPF inválido' });
    }
    cpfLimpo = String(cpf).replace(/[^\d]/g, '');
    const cpfExistente = db.get('customers').find({ cpf: cpfLimpo }).value();
    if (cpfExistente) {
      return res.status(409).json({ erro: 'Já existe um cadastro com esse CPF' });
    }
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const enderecoFinal = endereco || null;

  const novoCliente = {
    id: uuid(),
    nome,
    email: emailLimpo,
    senha: senhaHash,
    cpf: cpfLimpo,
    googleId: googleId || null,
    endereco: enderecoFinal,
    zonaEntrega: enderecoFinal ? calcularZonaEntrega(enderecoFinal.cidade) : null,
    criadoEm: new Date().toISOString()
  };

  db.get('customers').push(novoCliente).write();
  res.status(201).json(semSenha(novoCliente));
});

// POST /api/customers/login - autentica com e-mail + senha
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha são obrigatórios' });
  }

  const emailLimpo = String(email).trim().toLowerCase();
  const cliente = db.get('customers').find({ email: emailLimpo }).value();

  // Mensagem genérica de propósito — não revela se o erro foi e-mail ou senha.
  if (!cliente) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  const senhaCorreta = await bcrypt.compare(senha, cliente.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  res.json(semSenha(cliente));
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const cliente = db.get('customers').find({ id: req.params.id }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(semSenha(cliente));
});

// PUT /api/customers/:id - atualizar dados de perfil (nome, cpf, endereço)
// Recalcula a zona de entrega automaticamente se o endereço mudar.
router.put('/:id', (req, res) => {
  const clienteRef = db.get('customers').find({ id: req.params.id });
  if (!clienteRef.value()) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const { nome, cpf, endereco } = req.body;
  const atualizacoes = {};

  if (nome !== undefined) atualizacoes.nome = nome;

  if (cpf !== undefined) {
    if (cpf === null || cpf === '') {
      atualizacoes.cpf = null;
    } else {
      if (!cpfValido(cpf)) {
        return res.status(400).json({ erro: 'CPF inválido' });
      }
      const cpfLimpo = String(cpf).replace(/[^\d]/g, '');
      const cpfExistente = db.get('customers')
        .find({ cpf: cpfLimpo })
        .value();
      if (cpfExistente && cpfExistente.id !== req.params.id) {
        return res.status(409).json({ erro: 'Já existe um cadastro com esse CPF' });
      }
      atualizacoes.cpf = cpfLimpo;
    }
  }

  if (endereco !== undefined) {
    atualizacoes.endereco = endereco;
    atualizacoes.zonaEntrega = endereco ? calcularZonaEntrega(endereco.cidade) : null;
  }

  clienteRef.assign(atualizacoes).write();
  res.json(semSenha(clienteRef.value()));
});

module.exports = router;

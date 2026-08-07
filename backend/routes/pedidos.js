const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db');

// Gera um número de pedido sequencial e legível (#0001, #0002, ...)
function proximoNumeroPedido() {
  const total = db.get('pedidos').size().value();
  return String(total + 1).padStart(4, '0');
}

// POST /api/pedidos - cria um novo pedido (uso do app mobile, no checkout)
// Recebe os itens do carrinho e a cotação de frete já calculada,
// busca o cliente para tirar um "retrato" do endereço no momento da compra.
router.post('/', (req, res) => {
  const { clienteId, itens, frete } = req.body;

  if (!clienteId || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'clienteId e itens são obrigatórios' });
  }

  const cliente = db.get('customers').find({ id: clienteId }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  if (!cliente.endereco) return res.status(400).json({ erro: 'Cliente não tem endereço cadastrado' });

  const itensProcessados = itens.map((item) => ({
    produtoId: item.id,
    nome: item.nome,
    precoUnitario: Number(item.preco),
    quantidade: Number(item.quantidade),
    subtotal: Number(item.preco) * Number(item.quantidade)
  }));

  const subtotal = itensProcessados.reduce((soma, i) => soma + i.subtotal, 0);
  const valorFrete = frete?.valor ? Number(frete.valor) : 0;
  const total = subtotal + valorFrete;

  const novoPedido = {
    id: uuid(),
    numero: proximoNumeroPedido(),
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    clienteEmail: cliente.email,
    enderecoEntrega: { ...cliente.endereco }, // retrato do endereço no momento da compra
    itens: itensProcessados,
    subtotal,
    frete: {
      valor: valorFrete,
      duracaoEstimadaMinutos: frete?.duracaoEstimadaMinutos || null,
      quoteId: frete?.quoteId || null
    },
    total,
    status: 'aguardando_pagamento',
    criadoEm: new Date().toISOString()
  };

  db.get('pedidos').push(novoPedido).write();
  res.status(201).json(novoPedido);
});

// GET /api/pedidos - lista todos os pedidos (uso do admin), mais recentes primeiro
router.get('/', (req, res) => {
  const pedidos = db.get('pedidos').value();
  const ordenados = [...pedidos].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  res.json(ordenados);
});

// GET /api/pedidos/:id - detalhe de um pedido
router.get('/:id', (req, res) => {
  const pedido = db.get('pedidos').find({ id: req.params.id }).value();
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  res.json(pedido);
});

// PUT /api/pedidos/:id - atualizar status do pedido (uso do admin)
router.put('/:id', (req, res) => {
  const pedidoRef = db.get('pedidos').find({ id: req.params.id });
  if (!pedidoRef.value()) return res.status(404).json({ erro: 'Pedido não encontrado' });

  const { status } = req.body;
  const statusValidos = ['aguardando_pagamento', 'em_preparo', 'saiu_para_entrega', 'entregue', 'cancelado'];
  if (status && !statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  if (status) pedidoRef.assign({ status }).write();
  res.json(pedidoRef.value());
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { cotarEntrega, criarEntrega } = require('../services/uberDirect');

// POST /api/frete/cotacao
// Recebe { customerId } OU { endereco } direto, e devolve o valor/prazo do frete.
router.post('/cotacao', async (req, res) => {
  const { customerId, endereco } = req.body;

  let enderecoParaCotar = endereco || null;

  // Se veio customerId em vez de endereço direto, busca o endereço salvo dele.
  if (!enderecoParaCotar && customerId) {
    const cliente = db.get('customers').find({ id: customerId }).value();
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
    if (!cliente.endereco) return res.status(400).json({ erro: 'Cliente não tem endereço cadastrado' });
    enderecoParaCotar = cliente.endereco;
  }

  if (!enderecoParaCotar) {
    return res.status(400).json({ erro: 'Informe customerId ou endereco' });
  }

  try {
    const cotacao = await cotarEntrega(enderecoParaCotar);

    // A Uber devolve o valor em centavos (fee) — convertemos pra reais aqui,
    // já formatado pra ser fácil de exibir no checkout.
    res.json({
      valor: cotacao.fee ? cotacao.fee / 100 : null,
      moeda: cotacao.currency || 'BRL',
      duracaoEstimadaMinutos: cotacao.duration || null,
      expiraEm: cotacao.expires || null,
      quoteId: cotacao.id || null,
      bruto: cotacao // guardamos a resposta completa, útil pra debug
    });
  } catch (erro) {
    console.error('[frete] Erro ao cotar na Uber Direct:', erro.message);
    res.status(502).json({ erro: erro.message });
  }
});

// POST /api/frete/entrega
// Cria a entrega de verdade na Uber Direct, depois que o pagamento for confirmado.
// Recebe { customerId, itens, quoteId } — busca nome/telefone/endereço do cliente salvo.
// Também aceita nomeCliente/telefoneCliente/endereco diretos, se preferir passar sem customerId.
router.post('/entrega', async (req, res) => {
  const { customerId, endereco, nomeCliente, telefoneCliente, itens, quoteId } = req.body;

  let enderecoCliente = endereco || null;
  let nome = nomeCliente || null;
  let telefone = telefoneCliente || null;

  if (customerId) {
    const cliente = db.get('customers').find({ id: customerId }).value();
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
    if (!cliente.endereco) return res.status(400).json({ erro: 'Cliente não tem endereço cadastrado' });

    enderecoCliente = enderecoCliente || cliente.endereco;
    nome = nome || cliente.nome;
    telefone = telefone || cliente.telefone;
  }

  if (!enderecoCliente || !nome || !telefone) {
    return res.status(400).json({ erro: 'Informe customerId (com cadastro completo) ou endereco + nomeCliente + telefoneCliente' });
  }

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe os itens da entrega (itens: [{ nome, quantidade }])' });
  }

  try {
    const entrega = await criarEntrega({
      enderecoCliente,
      nomeCliente: nome,
      telefoneCliente: telefone,
      itens,
      quoteId
    });

    res.json({
      deliveryId: entrega.id || null,
      status: entrega.status || null,
      trackingUrl: entrega.tracking_url || null,
      bruto: entrega // guardamos a resposta completa, útil pra debug
    });
  } catch (erro) {
    console.error('[frete] Erro ao criar entrega na Uber Direct:', erro.message);
    res.status(502).json({ erro: erro.message });
  }
});

module.exports = router;

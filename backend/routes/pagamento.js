const express = require('express');
const router = express.Router();
const db = require('../db');
const { criarPedidoPix, consultarPedido } = require('../services/pagbank');

// POST /api/pagamento/pix
// Cria um pedido Pix e devolve o QR code pro checkout mostrar.
router.post('/pix', async (req, res) => {
  const { customerId, itens, valorTotalCentavos } = req.body;

  if (!customerId) return res.status(400).json({ erro: 'Informe customerId' });
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe os itens do pedido' });
  }
  if (!valorTotalCentavos) {
    return res.status(400).json({ erro: 'Informe valorTotalCentavos' });
  }

  const cliente = db.get('customers').find({ id: customerId }).value();
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  if (!cliente.email || !cliente.cpf) {
    return res.status(400).json({ erro: 'Cliente precisa ter email e cpf cadastrados' });
  }

  const referenceId = `pedido-${customerId}-${Date.now()}`;

  try {
    const pedido = await criarPedidoPix({
      referenceId,
      nomeCliente: cliente.nome,
      emailCliente: cliente.email,
      cpfCliente: cliente.cpf,
      telefoneCliente: cliente.telefone,
      itens,
      valorTotalCentavos
    });

    const qrCode = pedido.qr_codes?.[0];

    res.json({
      orderId: pedido.id,
      referenceId: pedido.reference_id,
      qrCodeTexto: qrCode?.text || null,       // "copia e cola" do Pix
      qrCodeExpiracao: qrCode?.expiration_date || null,
      bruto: pedido
    });
  } catch (erro) {
    console.error('[pagamento] Erro ao criar pedido Pix:', erro.message);
    res.status(502).json({ erro: erro.message });
  }
});

// GET /api/pagamento/status/:orderId
// O checkout pode chamar isso periodicamente (polling) pra saber se já pagou.
router.get('/status/:orderId', async (req, res) => {
  try {
    const pedido = await consultarPedido(req.params.orderId);
    const charge = pedido.charges?.[0];

    res.json({
      status: charge?.status || 'PENDING', // PAID, DECLINED, CANCELED, etc.
      bruto: pedido
    });
  } catch (erro) {
    console.error('[pagamento] Erro ao consultar pedido:', erro.message);
    res.status(502).json({ erro: erro.message });
  }
});

module.exports = router;

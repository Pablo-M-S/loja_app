// Serviço de integração com a API do PagBank (PagSeguro) - Pix via QR Code.
// Documentação: https://developer.pagbank.com.br/reference/criar-pedido-pedido-com-qr-code

const PAGBANK_API_URL = process.env.PAGBANK_SANDBOX === 'true'
  ? 'https://sandbox.api.pagseguro.com'
  : 'https://api.pagseguro.com';

// Cria um pedido com QR Code Pix. O cliente escaneia e paga; o PagBank
// avisa via webhook quando o pagamento é confirmado.
// dadosPedido = {
//   referenceId,          // ID do pedido na sua loja (ex: número do pedido interno)
//   nomeCliente, emailCliente, cpfCliente, telefoneCliente,
//   itens: [{ nome, quantidade, valorUnitarioCentavos }],
//   valorTotalCentavos
// }
async function criarPedidoPix(dadosPedido) {
  const { PAGBANK_TOKEN } = process.env;
  if (!PAGBANK_TOKEN) {
    throw new Error('PAGBANK_TOKEN não configurado');
  }

  const {
    referenceId,
    nomeCliente,
    emailCliente,
    cpfCliente,
    telefoneCliente,
    itens = [],
    valorTotalCentavos
  } = dadosPedido;

  if (!nomeCliente || !emailCliente || !cpfCliente) {
    throw new Error('Dados do cliente incompletos (nomeCliente, emailCliente, cpfCliente são obrigatórios)');
  }
  if (!itens.length || !valorTotalCentavos) {
    throw new Error('Informe os itens e o valor total do pedido');
  }

  // Expira em 30 minutos - tempo razoável pro cliente pagar antes de sair do checkout.
  const expiracao = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const telefoneLimpo = (telefoneCliente || '').replace(/[^\d]/g, '');

  const corpo = {
    reference_id: String(referenceId),
    customer: {
      name: nomeCliente,
      email: emailCliente,
      tax_id: String(cpfCliente).replace(/[^\d]/g, ''),
      phones: telefoneLimpo ? [{
        country: '55',
        area: telefoneLimpo.slice(0, 2),
        number: telefoneLimpo.slice(2),
        type: 'MOBILE'
      }] : []
    },
    items: itens.map((item, i) => ({
      reference_id: `item-${i}`,
      name: item.nome,
      quantity: item.quantidade,
      unit_amount: item.valorUnitarioCentavos
    })),
    qr_codes: [{
      amount: { value: valorTotalCentavos },
      expiration_date: expiracao
    }]
  };

  const resposta = await fetch(`${PAGBANK_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAGBANK_TOKEN}`
    },
    body: JSON.stringify(corpo)
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.error_messages?.[0]?.description || 'Falha ao criar pedido Pix no PagBank';
    const erro = new Error(mensagem);
    erro.detalhes = dados;
    throw erro;
  }

  return dados;
}

// Consulta o status atual de um pedido - útil pra checar se o Pix já foi pago.
async function consultarPedido(orderId) {
  const { PAGBANK_TOKEN } = process.env;
  if (!PAGBANK_TOKEN) {
    throw new Error('PAGBANK_TOKEN não configurado');
  }

  const resposta = await fetch(`${PAGBANK_API_URL}/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${PAGBANK_TOKEN}` }
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error('Falha ao consultar pedido no PagBank');
    erro.detalhes = dados;
    throw erro;
  }

  return dados;
}

module.exports = { criarPedidoPix, consultarPedido };

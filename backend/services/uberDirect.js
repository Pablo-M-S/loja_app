// Serviço de integração com a Uber Direct API.
// Documentação: https://developer.uber.com/docs/deliveries

const UBER_AUTH_URL = 'https://auth.uber.com/oauth/v2/token';
const UBER_API_URL = 'https://api.uber.com/v1';

// Cache simples do token em memória, pra não pedir um novo a cada requisição.
let tokenCache = { valor: null, expiraEm: 0 };

async function obterAccessToken() {
  const agora = Date.now();

  // Se ainda tem token válido (com 1 min de folga de segurança), reusa.
  if (tokenCache.valor && agora < tokenCache.expiraEm - 60000) {
    return tokenCache.valor;
  }

  const { UBER_CLIENT_ID, UBER_CLIENT_SECRET } = process.env;
  if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
    throw new Error('Credenciais da Uber Direct não configuradas (UBER_CLIENT_ID / UBER_CLIENT_SECRET)');
  }

  const params = new URLSearchParams();
  params.append('client_id', UBER_CLIENT_ID);
  params.append('client_secret', UBER_CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');
  params.append('scope', 'eats.deliveries');

  const resposta = await fetch(UBER_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Falha ao autenticar na Uber Direct: ${texto}`);
  }

  const dados = await resposta.json();
  tokenCache = {
    valor: dados.access_token,
    expiraEm: agora + (dados.expires_in * 1000)
  };

  return tokenCache.valor;
}

// Monta o objeto de endereço no formato que a Uber espera.
// Recebe um endereço "estilo loja_app" (rua, numero, bairro, cidade, estado, cep)
// e devolve a string JSON que a API pede.
function formatarEndereco({ rua, numero, complemento, bairro, cidade, estado, cep }) {
  return JSON.stringify({
    street_address: [
      `${rua || ''}, ${numero || ''}${bairro ? ' - ' + bairro : ''}`,
      complemento || ''
    ],
    city: cidade || '',
    state: estado || '',
    zip_code: cep ? String(cep).replace(/[^\d]/g, '') : '',
    country: 'BR'
  });
}

function enderecoDaLoja() {
  return {
    rua: process.env.LOJA_ENDERECO_RUA,
    numero: process.env.LOJA_ENDERECO_NUMERO,
    bairro: process.env.LOJA_ENDERECO_BAIRRO,
    cidade: process.env.LOJA_ENDERECO_CIDADE,
    estado: process.env.LOJA_ENDERECO_ESTADO,
    cep: process.env.LOJA_ENDERECO_CEP
  };
}

// Pede uma cotação de frete pra Uber Direct: quanto custa e quanto tempo leva
// para entregar do endereço da loja até o endereço do cliente.
async function cotarEntrega(enderecoCliente) {
  const { UBER_CUSTOMER_ID } = process.env;
  if (!UBER_CUSTOMER_ID) {
    throw new Error('UBER_CUSTOMER_ID não configurado');
  }

  const token = await obterAccessToken();

  const corpo = {
    pickup_address: formatarEndereco(enderecoDaLoja()),
    dropoff_address: formatarEndereco(enderecoCliente)
  };

  const resposta = await fetch(`${UBER_API_URL}/customers/${UBER_CUSTOMER_ID}/delivery_quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(corpo)
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.message || 'Falha ao cotar entrega na Uber Direct';
    const erro = new Error(mensagem);
    erro.detalhes = dados;
    throw erro;
  }

  return dados;
}

// Cria a entrega de verdade na Uber Direct, depois que o pagamento foi confirmado.
// dadosEntrega = {
//   enderecoCliente: { rua, numero, complemento, bairro, cidade, estado, cep },
//   nomeCliente, telefoneCliente,
//   itens: [{ nome, quantidade }],
//   quoteId (opcional, mas recomendado - trava o preço já cotado)
// }
async function criarEntrega(dadosEntrega) {
  const { UBER_CUSTOMER_ID } = process.env;
  if (!UBER_CUSTOMER_ID) {
    throw new Error('UBER_CUSTOMER_ID não configurado');
  }

  const {
    enderecoCliente,
    nomeCliente,
    telefoneCliente,
    itens = [],
    quoteId
  } = dadosEntrega;

  if (!enderecoCliente || !nomeCliente || !telefoneCliente) {
    throw new Error('Dados incompletos para criar entrega (enderecoCliente, nomeCliente, telefoneCliente são obrigatórios)');
  }

  const token = await obterAccessToken();

  const corpo = {
    pickup_address: formatarEndereco(enderecoDaLoja()),
    pickup_name: process.env.LOJA_NOME || 'Minha Loja',
    pickup_phone_number: process.env.LOJA_TELEFONE,

    dropoff_address: formatarEndereco(enderecoCliente),
    dropoff_name: nomeCliente,
    dropoff_phone_number: telefoneCliente,

    manifest_items: itens.map(item => ({
      name: item.nome,
      quantity: item.quantidade
    }))
  };

  // Se veio o ID da cotação já feita, usa ele pra travar o preço combinado.
  if (quoteId) {
    corpo.quote_id = quoteId;
  }

  const resposta = await fetch(`${UBER_API_URL}/customers/${UBER_CUSTOMER_ID}/deliveries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(corpo)
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.message || 'Falha ao criar entrega na Uber Direct';
    const erro = new Error(mensagem);
    erro.detalhes = dados;
    throw erro;
  }

  return dados; // contém delivery_id, tracking_url, status, etc.
}

module.exports = { cotarEntrega, criarEntrega, formatarEndereco, enderecoDaLoja };

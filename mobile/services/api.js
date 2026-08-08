import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

export function getMediaUrl(caminho) {
  if (!caminho) return null;
  if (caminho.startsWith('http')) return caminho;
  return `${SERVER_URL}${caminho}`;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const mensagem = data?.erro || 'Erro na comunicação com o servidor';
    throw new Error(mensagem);
  }

  return data;
}

export const api = {
  getCategories: () => request('/categories'),
  getProducts: (categoriaSlug) =>
    request(categoriaSlug ? `/products?categoria=${categoriaSlug}` : '/products'),
  getProduct: (id) => request(`/products/${id}`),
  getBanners: () => request('/banners?apenasAtivos=true'),
  registerCustomer: (dados) =>
    request('/customers', { method: 'POST', body: JSON.stringify(dados) }),
  login: (email, senha) =>
    request('/customers/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  loginWithGoogle: (idToken) =>
    request('/customers/google-login', { method: 'POST', body: JSON.stringify({ idToken }) }),
  getCustomer: (id) => request(`/customers/${id}`),
  updateCustomer: (id, dados) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  criarPedido: (dados) =>
    request('/pedidos', { method: 'POST', body: JSON.stringify(dados) }),
  getPedidosCliente: (clienteId) =>
    request(`/pedidos?clienteId=${clienteId}`),
  cotarFrete: (dados) =>
    request('/frete/cotacao', { method: 'POST', body: JSON.stringify(dados) }),
  criarPagamentoPix: (dados) =>
    request('/pagamento/pix', { method: 'POST', body: JSON.stringify(dados) }),
  consultarStatusPagamento: (orderId) =>
    request(`/pagamento/status/${orderId}`),
  criarEntrega: (dados) =>
    request('/frete/entrega', { method: 'POST', body: JSON.stringify(dados) })
};

// Centraliza as chamadas para o backend. Troque a apiUrl em app.json
// quando o backend estiver rodando na nuvem (Railway/Render/etc).

import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

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
  registerCustomer: (dados) =>
    request('/customers', { method: 'POST', body: JSON.stringify(dados) }),
  login: (cpf, senha) =>
    request('/customers/login', { method: 'POST', body: JSON.stringify({ cpf, senha }) }),
  getCustomerByCpf: (cpf) =>
    request(`/customers/by-cpf/${String(cpf).replace(/[^\d]/g, '')}`),
  updateCustomer: (id, dados) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
};

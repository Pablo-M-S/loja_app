const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve o painel admin (arquivos estáticos) em /admin
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensagem: 'Backend da loja rodando' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`Painel admin em http://0.0.0.0:${PORT}/admin`);
});

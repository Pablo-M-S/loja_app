const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db');

// GET /api/products?categoria=slug - lista produtos (filtra por categoria opcionalmente)
router.get('/', (req, res) => {
  const { categoria } = req.query;
  let products = db.get('products').value();

  if (categoria) {
    const cat = db.get('categories').find({ slug: categoria }).value();
    if (!cat) return res.status(404).json({ erro: 'Categoria não encontrada' });
    products = products.filter(p => p.categoriaId === cat.id);
  }

  res.json(products);
});

// GET /api/products/:id - detalhe de um produto
router.get('/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(product);
});

// POST /api/products - criar produto (uso do painel admin)
router.post('/', (req, res) => {
  const { nome, preco, estoque, categoriaId, descricao, imagemUrl } = req.body;

  if (!nome || preco === undefined || !categoriaId) {
    return res.status(400).json({ erro: 'nome, preco e categoriaId são obrigatórios' });
  }

  const categoria = db.get('categories').find({ id: categoriaId }).value();
  if (!categoria) return res.status(400).json({ erro: 'categoriaId inválido' });

  const novoProduto = {
    id: uuid(),
    categoriaId,
    nome,
    preco: Number(preco),
    estoque: Number(estoque) || 0,
    ativo: true,
    imagemUrl: imagemUrl || null,
    descricao: descricao || ''
  };

  db.get('products').push(novoProduto).write();
  res.status(201).json(novoProduto);
});

// PUT /api/products/:id - editar produto (preço, estoque, etc — uso do painel admin)
router.put('/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id });
  if (!product.value()) return res.status(404).json({ erro: 'Produto não encontrado' });

  const camposPermitidos = ['nome', 'preco', 'estoque', 'ativo', 'descricao', 'imagemUrl', 'categoriaId'];
  const atualizacoes = {};
  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) atualizacoes[campo] = req.body[campo];
  }

  product.assign(atualizacoes).write();
  res.json(product.value());
});

// DELETE /api/products/:id - remover produto (uso do painel admin)
router.delete('/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ erro: 'Produto não encontrado' });

  db.get('products').remove({ id: req.params.id }).write();
  res.json({ sucesso: true });
});

module.exports = router;

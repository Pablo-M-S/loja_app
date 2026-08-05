const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// GET /api/categories - lista todas as categorias
router.get('/', (req, res) => {
  const categories = db.get('categories').value();
  res.json(categories);
});

// POST /api/categories - cria uma nova categoria
router.post('/', (req, res) => {
  const { nome, slug, icone } = req.body;

  if (!nome || !slug) {
    return res.status(400).json({ erro: 'nome e slug são obrigatórios' });
  }

  const existente = db.get('categories').find({ slug }).value();
  if (existente) {
    return res.status(400).json({ erro: 'já existe uma categoria com esse slug' });
  }

  const novaCategoria = {
    id: crypto.randomUUID(),
    nome,
    slug,
    icone: icone || null
  };

  db.get('categories').push(novaCategoria).write();
  res.status(201).json(novaCategoria);
});

module.exports = router;

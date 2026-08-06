const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db');

// GET /api/banners - lista banners (admin pode ver todos; app mostra só ativos)
router.get('/', (req, res) => {
  const { apenasAtivos } = req.query;
  let banners = db.get('banners').value();

  if (apenasAtivos === 'true') {
    banners = banners.filter(b => b.ativo);
  }

  banners = banners.sort((a, b) => a.ordem - b.ordem);
  res.json(banners);
});

// POST /api/banners - criar banner
router.post('/', (req, res) => {
  const { imagemUrl, link, ordem } = req.body;

  if (!imagemUrl) {
    return res.status(400).json({ erro: 'imagemUrl é obrigatório' });
  }

  const novoBanner = {
    id: uuid(),
    imagemUrl,
    link: link || null,
    ordem: Number(ordem) || 0,
    ativo: true
  };

  db.get('banners').push(novoBanner).write();
  res.status(201).json(novoBanner);
});

// PUT /api/banners/:id - editar banner
router.put('/:id', (req, res) => {
  const banner = db.get('banners').find({ id: req.params.id });
  if (!banner.value()) return res.status(404).json({ erro: 'Banner não encontrado' });

  const camposPermitidos = ['imagemUrl', 'link', 'ordem', 'ativo'];
  const atualizacoes = {};
  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) atualizacoes[campo] = req.body[campo];
  }

  banner.assign(atualizacoes).write();
  res.json(banner.value());
});

// DELETE /api/banners/:id - remover banner
router.delete('/:id', (req, res) => {
  const banner = db.get('banners').find({ id: req.params.id }).value();
  if (!banner) return res.status(404).json({ erro: 'Banner não encontrado' });

  db.get('banners').remove({ id: req.params.id }).write();
  res.json({ sucesso: true });
});

module.exports = router;

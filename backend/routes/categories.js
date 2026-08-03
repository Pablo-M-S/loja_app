const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories - lista todas as categorias
router.get('/', (req, res) => {
  const categories = db.get('categories').value();
  res.json(categories);
});

module.exports = router;

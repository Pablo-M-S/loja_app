const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const { uploadsDir } = require('../paths');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.'));
    }
    cb(null, true);
  }
});

// POST /api/upload - recebe um arquivo no campo "imagem", devolve a URL
router.post('/', (req, res) => {
  upload.single('imagem')(req, res, (err) => {
    if (err) return res.status(400).json({ erro: err.message });
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

module.exports = router;

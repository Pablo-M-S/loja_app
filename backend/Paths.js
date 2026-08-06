const path = require('path');
const fs = require('fs');

const baseDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const uploadsDir = path.join(baseDir, 'uploads');

// Garante que a pasta existe (localmente ela não vem criada)
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = { uploadsDir };

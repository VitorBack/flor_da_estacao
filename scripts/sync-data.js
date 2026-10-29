const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'database.json'), 'utf8'));
fs.writeFileSync(path.join(root, 'data', 'seed.js'), '// Gerado a partir de database.json por npm run sync.\nwindow.FLOR_SEED = ' + JSON.stringify(data, null, 2) + ';\n');

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
require('./sync-data.js');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400); res.end('Endereço inválido.'); return; }
  if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  if (filename === root) filename = path.join(root, 'index.html');
  fs.readFile(filename, (err, content) => {
    if (err) { res.writeHead(404); res.end('Arquivo não encontrado.'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(content);
  });
});
const port = Number(process.env.PORT) || 5173;
server.on('error', (error) => { console.error(error.code === 'EADDRINUSE' ? `A porta ${port} está ocupada. Use outra porta com a variável PORT.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Flor da Estação disponível em http://localhost:${port}`));

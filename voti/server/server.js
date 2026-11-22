// Backend sul Mac: tiene lo stato in data.json e lo serve a tutti i telefoni via tunnel Cloudflare.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { apply, empty } = require('../app.js');

const FILE = path.join(__dirname, 'data.json');
const PORT = 8787;
let state = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : empty();

function save() {
  // scrittura atomica: un crash a metà non corrompe il file
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(state));
  fs.renameSync(FILE + '.tmp', FILE);
}

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/state') return send(res, 200, state);
  if (req.method === 'POST' && req.url === '/api/op') {
    let body = '';
    req.on('data', c => {
      body += c;
      if (body.length > 100_000) req.destroy();
    });
    req.on('end', () => {
      let op;
      try { op = JSON.parse(body); } catch { return send(res, 400, { error: 'json' }); }
      if (!op || !apply(state, op)) return send(res, 400, { error: 'op' });
      save();
      send(res, 200, state);
    });
    return;
  }
  send(res, 404, { error: 'not found' });
}).listen(PORT, '127.0.0.1', () => console.log('factanza-voti su http://127.0.0.1:' + PORT));

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;
let clients = [];

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Live reload SSE script to inject into HTML
const RELOAD_SCRIPT = `
<script>
  (function() {
    let es = new EventSource('/__livereload');
    es.onmessage = function(e) {
      if (e.data === 'reload') {
        console.log('[LiveReload] File change detected. Reloading page...');
        location.reload();
      }
    };
    es.onerror = function() {
      setTimeout(() => {
        new EventSource('/__livereload');
      }, 2000);
    };
  })();
</script>
`;

const server = http.createServer((req, res) => {
  // Savegame API endpoint
  if (req.url === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      fs.writeFile(path.join(ROOT, 'savegame.json'), body, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', error: err.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        }
      });
    });
    return;
  }

  // Live reload SSE endpoint
  if (req.url === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('retry: 1000\n\n');
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(client => client !== res);
    });
    return;
  }

  // Resolve requested file path
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  let filePath = path.join(ROOT, reqPath);

  // Security check: ensure path is within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(ROOT, 'miners-haven.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('500 Internal Server Error: ' + err.code);
        return;
      }

      if (ext === '.html') {
        let htmlStr = content.toString('utf8');
        if (htmlStr.includes('</body>')) {
          htmlStr = htmlStr.replace('</body>', `${RELOAD_SCRIPT}\n</body>`);
        } else {
          htmlStr += RELOAD_SCRIPT;
        }
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
        res.end(htmlStr);
      } else {
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
        res.end(content);
      }
    });
  });
});

// File watcher for hot reloading
let debounceTimer = null;
fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
  if (!filename || filename === 'server.js' || filename === 'savegame.json' || filename.startsWith('.')) return;
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`[LiveReload] ${filename} changed. Notifying ${clients.length} client(s)...`);
    clients.forEach(client => client.write('data: reload\n\n'));
  }, 100);
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Miner's Haven Hot-Reloading Dev Server Started!`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`📄 Serving: ${ROOT}`);
  console.log(`==================================================\n`);
});

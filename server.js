const http = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// Load .env.local manually if present (next loads it too, but server.js starts first)
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  global.__velvetIO = io;

  io.on('connection', (socket) => {
    socket.on('join:role', (role) => {
      if (role) socket.join(`role:${String(role).toLowerCase()}`);
    });

    socket.on('join:table', (tableNumber) => {
      if (tableNumber) socket.join(`table:${tableNumber}`);
    });

    socket.on('join:order', (orderId) => {
      if (orderId) socket.join(`order:${orderId}`);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`\n🍷 Velvet Cafe & Grill Server is LIVE on http://${hostname}:${port}`);
    console.log(`   Mode: ${dev ? 'Development' : 'Production'}`);
    console.log(`   Supabase Sync: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ENABLED' : 'Local Persistent Engine (Zero-Config)'}\n`);
  });
});

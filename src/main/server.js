const http = require('http');

// In-memory log of all messages received via the sandbox UI
let messages = [];
const serverStartTime = Date.now();

function startServer(port = 3000) {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // GET /api/status
    if (req.method === 'GET' && parsedUrl.pathname === '/api/status') {
      const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        uptimeSeconds,
        totalMessages: messages.length,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // POST /api/message
    if (req.method === 'POST' && parsedUrl.pathname === '/api/message') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const params = new URLSearchParams(body);
        const message = params.get('message') ?? body;
        const timestamp = new Date().toISOString();
        messages.push({ message, timestamp });
        // Respond with JSON so the client can confirm delivery
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', message }));
      });
      return;
    }

    // GET /api/messages
    if (req.method === 'GET' && parsedUrl.pathname === '/api/messages') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(messages));
      return;
    }

    // POST /api/clear or DELETE /api/messages
    if ((req.method === 'POST' || req.method === 'DELETE') && (parsedUrl.pathname === '/api/clear' || parsedUrl.pathname === '/api/messages')) {
      messages = [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', cleared: true }));
      return;
    }

    // Any other route – simple 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      server.listen(port + 1);
    } else {
      console.error('Server error:', err.message);
    }
  });

  server.listen(port, () => {
    console.log(`FocusFlight sandbox server listening on http://localhost:${server.address().port}`);
  });
}

module.exports = { startServer };

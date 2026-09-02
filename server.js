const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { wsManager } = require('./lib/websocketServer');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
   // Create HTTP server
   const server = createServer(async (req, res) => {
      try {
         const parsedUrl = parse(req.url, true);
         await handle(req, res, parsedUrl);
      } catch (err) {
         console.error('Error handling request:', err);
         res.statusCode = 500;
         res.end('internal server error');
      }
   });

   // Initialize WebSocket on the HTTP server
   wsManager.initialize(server);
   console.log('✓ WebSocket server initialized');

   // Start server
   server.listen(port, (err) => {
      if (err) throw err;
      console.log(`✓ Server running at http://${hostname}:${port}`);
      console.log(`✓ WebSocket available at ws://${hostname}:${port}`);
   });
});

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Proxy tracking requests to Next.js API
app.use('/tracking', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/tracking': '/api/tracking'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Tracking Proxy] ${req.method} ${req.url} -> http://localhost:3002/api${req.url.replace('/tracking', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Ensure CORS headers are set on the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('[Tracking Proxy] Error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tracking proxy server is running', port: PORT });
});

// Fallback for any other requests
app.use('/*', (req, res) => {
  console.log(`[Tracking Proxy] Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Tracking proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying /tracking/* to http://localhost:3002/api/tracking/*`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
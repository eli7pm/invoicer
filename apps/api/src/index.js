require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const { closeBrowser, getBrowser } = require('shared/pdf');

const PORT = Number(process.env.PORT) || 3100;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin && ALLOWED_ORIGINS.includes(origin) ? 204 : 403);
  next();
});

app.use(express.json({ limit: '2mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', require('./routes/invoice'));

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 413 ? 'The invoice is too large (try a smaller logo).' : 'Something went wrong.' });
});

const server = app.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
  getBrowser().catch((err) => console.error('[pdf] Chrome failed to start:', err.message));
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close();
    closeBrowser().finally(() => process.exit(0));
  });
}

const { sendInvoiceEmail: _sendInvoiceEmail } = require('shared/mailer');
const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1h'),
  analytics: true
});

function checkOrigin(req) {
  if (process.env.NODE_ENV !== 'production') return true;
  const origin = req.headers.origin || req.headers.referer || '';
  const host = req.headers.host;
  return origin.includes(host);
}

async function sendInvoiceEmail({ pdfBuffer, recipientEmail, invoiceNumber, ip, req }) {
  if (!checkOrigin(req)) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    const err = new Error(`Rate limit exceeded. Try again at ${new Date(reset).toISOString()}`);
    err.status = 429;
    throw err;
  }

  console.log(`[mailer] ${ip} — ${remaining}/${limit} sends remaining this window`);

  return _sendInvoiceEmail({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_USER,
    pdfBuffer,
    recipientEmail,
    invoiceNumber
  });
}

module.exports = { sendInvoiceEmail };

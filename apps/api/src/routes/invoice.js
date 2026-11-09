const express = require('express');
const { generateHTML, CURRENCIES, DEFAULT_CURRENCY, TAX_ID_TYPES } = require('shared');
const { htmlToPdf } = require('../services/pdf');
const { saveShared, loadShared } = require('../services/share-store');

const router = express.Router();

const SEND_ENABLED = process.env.SEND_ENABLED === 'true';
const MAX_TEXT = 2000;
const MAX_TAX_ID = 40;
const MAX_LINE_ITEMS = 50;
const MAX_LOGO = 1_500_000;
const MAX_CONCURRENT_RENDERS = Number(process.env.MAX_CONCURRENT_RENDERS) || 3;
const MAX_SHARED_LOGO = 200_000;

const TEXT_FIELDS = ['invoiceNumber', 'date', 'dueDate', 'from', 'billTo', 'bankDetails', 'terms'];

let activeRenders = 0;

function rateLimit(max, windowMs) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of hits) if (!times.some((t) => now - t < windowMs)) hits.delete(ip);
  }, windowMs).unref();

  return (ip) => {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return false;
    recent.push(now);
    hits.set(ip, recent);
    return true;
  };
}

const allowPreview = rateLimit(30, 10 * 60 * 1000);
const allowShare = rateLimit(20, 60 * 60 * 1000);

function readInvoice(body) {
  const input = body?.invoice;
  if (!input || typeof input !== 'object') return { error: 'Missing invoice' };

  const invoice = {};
  for (const key of TEXT_FIELDS) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > MAX_TEXT) return { error: `Invalid ${key}` };
    invoice[key] = value;
  }

  if (input.logo != null && (typeof input.logo !== 'string' || input.logo.length > MAX_LOGO)) {
    return { error: 'Logo is too large' };
  }
  invoice.logo = input.logo ?? null;
  invoice.currency = CURRENCIES.includes(input.currency) ? input.currency : DEFAULT_CURRENCY;
  invoice.lang = input.lang === 'es' ? 'es' : 'en';

  const taxId = input.fromTaxId ?? '';
  if (typeof taxId !== 'string' || taxId.length > MAX_TAX_ID) return { error: 'Invalid fromTaxId' };
  invoice.fromTaxId = taxId.trim();
  invoice.fromTaxIdType = Object.hasOwn(TAX_ID_TYPES, input.fromTaxIdType) ? input.fromTaxIdType : 'OTHER';

  const items = Array.isArray(input.lineItems) ? input.lineItems : [];
  if (items.length > MAX_LINE_ITEMS) return { error: 'Too many line items' };
  invoice.lineItems = items.map((item) => ({
    description: String(item?.description ?? '').slice(0, MAX_TEXT),
    quantity: Number(item?.quantity) || 0,
    rate: Number(item?.rate) || 0,
  }));

  return { invoice };
}

async function render(invoice) {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    const err = new Error('The preview server is busy. Try again in a few seconds.');
    err.status = 503;
    throw err;
  }
  activeRenders++;
  try {
    return await htmlToPdf(generateHTML(invoice));
  } finally {
    activeRenders--;
  }
}

router.post('/preview', async (req, res) => {
  if (!allowPreview(req.ip)) {
    return res.status(429).json({ error: 'Too many previews. Try again in a few minutes.' });
  }
  const { invoice, error } = readInvoice(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const pdf = await render(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="invoice-preview.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(pdf));
  } catch (err) {
    console.error('[preview]', err.message);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to generate the PDF.' });
  }
});

router.post('/share', async (req, res) => {
  if (!allowShare(req.ip)) {
    return res.status(429).json({ error: 'Too many shared links. Try again later.' });
  }
  const { invoice, error } = readInvoice(req.body);
  if (error) return res.status(400).json({ error });
  if (invoice.logo && invoice.logo.length > MAX_SHARED_LOGO) return res.status(413).json({ error: 'Logo is too large to share' });

  try {
    res.status(201).json(await saveShared(invoice));
  } catch (err) {
    console.error('[share]', String(err.message).split(/[.,]/)[0]);
    res.status(500).json({ error: 'Could not create the link.' });
  }
});

router.get('/share/:id', async (req, res) => {
  try {
    const invoice = await loadShared(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'This link has expired or does not exist.' });
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.json({ invoice });
  } catch (err) {
    console.error('[share]', String(err.message).split(/[.,]/)[0]);
    res.status(500).json({ error: 'Could not load the invoice.' });
  }
});

router.post('/send', async (req, res) => {
  if (!SEND_ENABLED) {
    return res.status(403).json({ error: 'Sending is turned off in the public demo.' });
  }
  const { invoice, error } = readInvoice(req.body);
  const recipientEmail = req.body?.recipientEmail;
  if (error) return res.status(400).json({ error });
  if (typeof recipientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid recipient email' });
  }

  try {
    const { sendInvoiceEmail } = require('../services/mailer');
    const pdfBuffer = await render(invoice);
    await sendInvoiceEmail({ pdfBuffer, recipientEmail, invoiceNumber: invoice.invoiceNumber, ip: req.ip, req });
    res.json({ success: true });
  } catch (err) {
    console.error('[send]', err.message);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to send the invoice.' });
  }
});

module.exports = router;

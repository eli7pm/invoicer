const express = require('express');
const router = express.Router();
const { htmlToPdf } = require('../services/pdf');
const { sendInvoiceEmail } = require('../services/mailer');

router.post('/preview', async (req, res) => {
  console.log('[preview] html length:', req.body?.html?.length);
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'Missing html' });
    }

    const pdf = await htmlToPdf(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.send(pdf);
  } catch (err) {
    console.error('[preview]', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { html, recipientEmail, invoiceNumber } = req.body;

    if (!html || !recipientEmail || !invoiceNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pdfBuffer = await htmlToPdf(html);

    await sendInvoiceEmail({
      pdfBuffer,
      recipientEmail,
      invoiceNumber,
      ip: req.ip,
      req
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[send]', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to send invoice' });
  }
});

module.exports = router;

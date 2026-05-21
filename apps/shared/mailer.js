const { Resend } = require('resend');

async function sendInvoiceEmail({ apiKey, from, pdfBuffer, recipientEmail, invoiceNumber }) {
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: recipientEmail,
    subject: `Invoice #${invoiceNumber}`,
    html: `
      <p>Hi,</p>
      <p>Please find invoice <strong>#${invoiceNumber}</strong> attached.</p>
      <p>Thank you.</p>
    `,
    attachments: [{
      filename: `invoice-${invoiceNumber}.pdf`,
      content: Buffer.from(pdfBuffer).toString('base64'),
      contentType: 'application/pdf'
    }]
  });

  if (error) throw Object.assign(new Error(error.message), { status: 422 });

  return data;
}

module.exports = { sendInvoiceEmail };

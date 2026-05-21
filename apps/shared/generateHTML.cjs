function generateHTML(values) {
  const {
    logo,
    invoiceNumber,
    date,
    dueDate,
    from,
    billTo,
    bankDetails,
    terms,
    lineItems = []
  } = values;

  const total = lineItems
    .reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0)
    .toFixed(2);

  const rows = lineItems.map((item) => `
    <tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || 0}</td>
      <td>$${(item.rate || 0).toFixed(2)}</td>
      <td>$${((item.quantity || 0) * (item.rate || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  const logoHTML = logo
    ? `<img src="${logo}" alt="Logo" style="max-width:160px;max-height:100px;object-fit:contain;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #18181b;
      padding: 48px;
      line-height: 1.6;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }

    .invoice-title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #7c3aed;
    }

    .meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    .meta-row span:first-child {
      color: #71717a;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .parties {
      display: flex;
      gap: 40px;
      margin-bottom: 40px;
    }

    .party {
      flex: 1;
    }

    .party-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      margin-bottom: 6px;
    }

    .party-value {
      white-space: pre-line;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      text-align: left;
      padding: 0 8px 10px 8px;
      border-bottom: 1px solid #e4e4e7;
    }

    th:not(:first-child) { text-align: right; }

    td {
      padding: 10px 8px;
      border-bottom: 1px solid #f4f4f5;
      vertical-align: middle;
    }

    td:not(:first-child) { text-align: right; }

    .total-row {
      display: flex;
      justify-content: flex-end;
      gap: 48px;
      font-size: 15px;
      font-weight: 700;
      padding: 16px 8px;
      border-top: 2px solid #18181b;
      margin-bottom: 40px;
    }

    .footer {
      display: flex;
      gap: 40px;
    }

    .footer-block {
      flex: 1;
    }

    .footer-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      margin-bottom: 6px;
    }

    .footer-value {
      white-space: pre-line;
      font-size: 12px;
      color: #3f3f46;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${logoHTML}</div>
    <div class="meta">
      <div class="invoice-title">INVOICE</div>
      <div class="meta-row">
        <span>#</span>
        <span>${invoiceNumber}</span>
      </div>
      ${date ? `<div class="meta-row"><span>Date</span><span>${date}</span></div>` : ''}
      ${dueDate ? `<div class="meta-row"><span>Due Date</span><span>${dueDate}</span></div>` : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">From</div>
      <div class="party-value">${from}</div>
    </div>
    <div class="party">
      <div class="party-label">Bill To</div>
      <div class="party-value">${billTo}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total-row">
    <span>Total</span>
    <span>$${total}</span>
  </div>

  <div class="footer">
    ${bankDetails ? `
    <div class="footer-block">
      <div class="footer-label">Bank Details</div>
      <div class="footer-value">${bankDetails}</div>
    </div>` : ''}
    ${terms ? `
    <div class="footer-block">
      <div class="footer-label">Terms</div>
      <div class="footer-value">${terms}</div>
    </div>` : ''}
  </div>
</body>
</html>`;
}

module.exports = { generateHTML };

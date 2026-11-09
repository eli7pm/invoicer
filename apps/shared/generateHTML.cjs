const LOGO_DATA_URL = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const CURRENCY_SYMBOLS = { USD: 'US$', EUR: '€', DOP: 'RD$', CAD: 'CA$', MXN: 'MX$', COP: 'COL$', BRL: 'R$' };
const CURRENCY_LOCALES = { USD: 'en-US', EUR: 'de-DE', DOP: 'es-DO', CAD: 'en-CA', MXN: 'es-MX', COP: 'es-CO', BRL: 'pt-BR' };
const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);
const DEFAULT_CURRENCY = 'USD';

const TAX_ID_TYPES = {
  RNC: { en: 'RNC', es: 'RNC' },
  CEDULA: { en: 'Cédula', es: 'Cédula' },
  RFC: { en: 'RFC', es: 'RFC' },
  NIT: { en: 'NIT', es: 'NIT' },
  CNPJ: { en: 'CNPJ', es: 'CNPJ' },
  CPF: { en: 'CPF', es: 'CPF' },
  BN: { en: 'BN', es: 'BN' },
  EIN: { en: 'EIN', es: 'EIN' },
  VAT: { en: 'VAT ID', es: 'NIF-IVA' },
  OTHER: { en: 'Tax ID', es: 'ID fiscal' },
};

const LABELS = {
  en: {
    locale: 'en-US',
    invoice: 'INVOICE',
    number: '#',
    date: 'Date',
    dueDate: 'Due Date',
    from: 'From',
    billTo: 'Bill To',
    item: 'Item',
    quantity: 'Quantity',
    rate: 'Rate',
    amount: 'Amount',
    total: 'Total',
    bankDetails: 'Bank Details',
    terms: 'Terms',
  },
  es: {
    locale: 'es-DO',
    invoice: 'FACTURA',
    number: 'N.º',
    date: 'Fecha',
    dueDate: 'Vencimiento',
    from: 'De',
    billTo: 'Facturar a',
    item: 'Concepto',
    quantity: 'Cantidad',
    rate: 'Precio',
    amount: 'Importe',
    total: 'Total',
    bankDetails: 'Datos bancarios',
    terms: 'Términos',
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function currencyCode(value) {
  return CURRENCIES.includes(value) ? value : DEFAULT_CURRENCY;
}

function labelsFor(lang) {
  return LABELS[lang] || LABELS.en;
}

function formatMoney(value, currency) {
  const code = currencyCode(currency);
  const parts = new Intl.NumberFormat(CURRENCY_LOCALES[code], {
    style: 'currency',
    currency: code,
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(toNumber(value));
  const symbolFirst = parts.findIndex((p) => p.type === 'currency') < parts.findIndex((p) => p.type === 'integer');
  return parts
    .map((part) => {
      if (part.type === 'currency') return CURRENCY_SYMBOLS[code];
      if (part.type === 'literal' && /^\s+$/.test(part.value)) return symbolFirst ? '' : ' ';
      return part.value;
    })
    .join('');
}

function generateHTML(values = {}) {
  const lineItems = Array.isArray(values.lineItems) ? values.lineItems : [];
  const total = lineItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate), 0);
  const t = labelsFor(values.lang);
  const money = (value) => formatMoney(value, values.currency);

  const rows = lineItems
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td>${toNumber(item.quantity)}</td>
      <td>${money(item.rate)}</td>
      <td>${money(toNumber(item.quantity) * toNumber(item.rate))}</td>
    </tr>`,
    )
    .join('');

  const logo = typeof values.logo === 'string' && LOGO_DATA_URL.test(values.logo) ? values.logo : null;
  const logoHTML = logo ? `<img src="${logo}" alt="Logo" style="max-width:160px;max-height:100px;object-fit:contain;" />` : '';

  const field = (label, value) =>
    value ? `<div class="meta-row"><span>${label}</span><span>${escapeHtml(value)}</span></div>` : '';

  const taxIdType = TAX_ID_TYPES[values.fromTaxIdType] ? values.fromTaxIdType : 'OTHER';
  const taxIdLine = values.fromTaxId
    ? `<div class="tax-id">${TAX_ID_TYPES[taxIdType][values.lang === 'es' ? 'es' : 'en']}: ${escapeHtml(values.fromTaxId)}</div>`
    : '';

  const block = (cls, label, value, extra = '') =>
    value
      ? `<div class="${cls}-block">
      <div class="${cls}-label">${label}</div>
      <div class="${cls}-value">${escapeHtml(value)}</div>${extra}
    </div>`
      : extra
        ? `<div class="${cls}-block"><div class="${cls}-label">${label}</div>${extra}</div>`
        : '';

  return `<!DOCTYPE html>
<html lang="${values.lang === 'es' ? 'es' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif;
      font-size: 13px;
      color: #2b1d1a;
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
      color: #852537;
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

    .meta-row span:first-child,
    .party-label,
    .footer-label,
    th {
      color: #596022;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .parties {
      display: flex;
      gap: 40px;
      margin-bottom: 40px;
    }

    .party-block { flex: 1; }
    .party-label, .footer-label { margin-bottom: 6px; }
    .party-value, .footer-value { white-space: pre-line; }
    .tax-id { margin-top: 6px; font-size: 12px; color: #4b3a35; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    th {
      text-align: left;
      padding: 0 8px 10px 8px;
      border-bottom: 1px solid #e3d9c6;
    }

    th:not(:first-child) { text-align: right; }

    td {
      padding: 10px 8px;
      border-bottom: 1px solid #f1eadc;
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
      border-top: 2px solid #852537;
      margin-bottom: 40px;
    }

    .footer {
      display: flex;
      gap: 40px;
    }

    .footer-block { flex: 1; }

    .footer-value {
      font-size: 12px;
      color: #4b3a35;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${logoHTML}</div>
    <div class="meta">
      <div class="invoice-title">${t.invoice}</div>
      <div class="meta-row"><span>${t.number}</span><span>${escapeHtml(values.invoiceNumber)}</span></div>
      ${field(t.date, values.date)}
      ${field(t.dueDate, values.dueDate)}
    </div>
  </div>

  <div class="parties">
    ${block('party', t.from, values.from, taxIdLine) || '<div class="party-block"></div>'}
    ${block('party', t.billTo, values.billTo) || '<div class="party-block"></div>'}
  </div>

  <table>
    <thead>
      <tr>
        <th>${t.item}</th>
        <th>${t.quantity}</th>
        <th>${t.rate}</th>
        <th>${t.amount}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total-row">
    <span>${t.total}</span>
    <span>${money(total)}</span>
  </div>

  <div class="footer">
    ${block('footer', t.bankDetails, values.bankDetails)}
    ${block('footer', t.terms, values.terms)}
  </div>
</body>
</html>`;
}

module.exports = { CURRENCY_LOCALES, generateHTML, escapeHtml, formatMoney, CURRENCIES, DEFAULT_CURRENCY, TAX_ID_TYPES };

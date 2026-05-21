# invoicer CLI

Generate and send PDF invoices from the terminal.

## Requirements

- Node.js 22+
- Google Chrome installed at `/Applications/Google Chrome.app`
- A configured `.env` at the project root

## Install

From the project root:

```bash
cd apps/cli && npm link
```

Then run from anywhere:

```bash
invoicer
```

## Usage

You'll be prompted for:

- **Invoice number** — incremental number for the invoice
- **Month** — select with ↑↓ arrows
- **Amount** — in USD
- **From** — select from configured senders
- **Bill to** — select from configured recipients
- **Bank account** — select from configured accounts
- **Recipient email** — where to send the invoice
- **Send via email** — confirm before sending

## Configuration

Create `apps/cli/invoice.config.json` to define your reusable details:

```json
{
  "from": [
    {
      "name": "John Doe",
      "details": "John Doe\n123 Main Street\nSan Francisco, CA 94105\nUnited States"
    }
  ],
  "billTo": [
    {
      "name": "Acme Corp",
      "details": "Acme Corp\n456 Market Street\nNew York, NY 10001\nUnited States"
    }
  ],
  "bankAccounts": [
    {
      "name": "Wise USD",
      "details": "Beneficiary: John Doe\nRouting number: 021000021\nSWIFT/BIC: CHASUS33\nAccount number: 1234567890"
    }
  ]
}
```

## Environment

Reads from the root `.env`:

```
RESEND_API_KEY=your_resend_api_key
EMAIL_USER=onboarding@resend.dev
```

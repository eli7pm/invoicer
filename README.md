# invoicer

A self-hosted invoice generator built with React, Node.js, Puppeteer, and Resend. Generate PDF invoices from a web UI or the command line and send them via email.

## Structure

```
invoicer/
├── apps/
│   ├── web/      # React invoice UI (Vite)
│   ├── api/      # Express backend (PDF generation + email)
│   ├── cli/      # CLI tool
│   └── shared/   # Shared PDF, mailer, and HTML template
└── pnpm-workspace.yaml
```

## Requirements

- Node.js 22+ (arm64 on Apple Silicon)
- pnpm
- Google Chrome installed at `/Applications/Google Chrome.app`
- Resend account
- Upstash Redis account

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in your credentials in `.env`.

## Development

```bash
pnpm dev        # start both web and api
pnpm web        # web only
pnpm api        # api only
```

Web runs on `http://localhost:5173`, API on `http://localhost:3000`.

## CLI

See [apps/cli/README.md](apps/cli/README.md) for setup and usage.

## Environment Variables

| Variable | Description |
|---|---|
| `EMAIL_USER` | Sender email address |
| `RESEND_API_KEY` | Resend API key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `NODE_ENV` | `development` or `production` |

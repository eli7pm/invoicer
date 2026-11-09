#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { generateHTML } = require('shared');
const { htmlToPdf, closeBrowser } = require('shared/pdf');
const { sendInvoiceEmail } = require('shared/mailer');

const now = new Date();

const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), i, 1);
  return d.toLocaleString('en', { month: 'long', year: 'numeric' });
});

function lastDayOfMonth(monthStr) {
  const [month, year] = monthStr.split(' ');
  const d = new Date(`${month} 1, ${year}`);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

function loadConfig() {
  const configPath = path.resolve(__dirname, '../invoice.config.json');
  if (!fs.existsSync(configPath)) {
    console.log(chalk.yellow('\n  No invoice.config.json found. Using defaults.\n'));
    return null;
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function main() {
  console.log(chalk.magenta('\n  invoicer CLI\n'));

  const config = loadConfig();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'invoiceNumber',
      message: 'Invoice number:',
      default: '1'
    },
    {
      type: 'list',
      name: 'month',
      message: 'Month:',
      choices: months,
      default: now.toLocaleString('en', { month: 'long', year: 'numeric' })
    },
    {
      type: 'input',
      name: 'amount',
      message: 'Amount (USD):',
      default: '1000'
    },
    {
      type: 'list',
      name: 'from',
      message: 'From:',
      choices: config?.from?.map(f => ({ name: f.name, value: f.details })) || [{ name: 'John Doe', value: 'John Doe\n123 Main Street\nSan Francisco, CA 94105\nUnited States' }]
    },
    {
      type: 'list',
      name: 'billTo',
      message: 'Bill to:',
      choices: config?.billTo?.map(b => ({ name: b.name, value: b.details })) || [{ name: 'Acme Corp', value: 'Acme Corp\n456 Market Street\nNew York, NY 10001\nUnited States' }]
    },
    {
      type: 'list',
      name: 'bankAccount',
      message: 'Bank account:',
      choices: config?.bankAccounts?.map(b => ({ name: b.name, value: b.details })) || [{ name: 'Default', value: '' }]
    },
    {
      type: 'input',
      name: 'recipientEmail',
      message: 'Send to:'
    },
    {
      type: 'confirm',
      name: 'sendEmail',
      message: 'Send via email?',
      default: true
    }
  ]);

  const values = {
    invoiceNumber: answers.invoiceNumber,
    date: now.toISOString().split('T')[0],
    dueDate: lastDayOfMonth(answers.month),
    from: answers.from,
    billTo: answers.billTo,
    bankDetails: answers.bankAccount,
    terms: 'Payment due within 10 days of receipt.',
    logo: null,
    lineItems: [
      {
        description: `${answers.month} - Services rendered`,
        quantity: 1,
        rate: Number(answers.amount)
      }
    ]
  };

  console.log(chalk.dim('\n  Generating PDF...'));
  const html = generateHTML(values);
  const pdf = await htmlToPdf(html);
  await closeBrowser();

  if (answers.sendEmail && answers.recipientEmail) {

    try {
      await sendInvoiceEmail({
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_USER,
        pdfBuffer: pdf,
        recipientEmail: answers.recipientEmail,
        invoiceNumber: answers.invoiceNumber
      });
      console.log(chalk.green(`\n  ✓ Invoice sent to ${answers.recipientEmail}`));
    } catch (err) {
      console.error(chalk.red('\n  Failed to send email:'), err.message);
      process.exit(1);
    }
  } else {
    console.log(chalk.green('\n  ✓ PDF generated'));
  }
}

main().catch(err => {
  console.error(chalk.red('\n  Error:'), err.message);
  process.exit(1);
});

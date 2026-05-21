import InvoiceForm from './components/InvoiceForm';
import ThemeToggle from './components/ThemeToggle';
import { generateHTML } from 'shared';
import './App.css';

export default function App() {
  async function handlePreview(values) {
    const html = generateHTML(values);
    console.log('html length:', html?.length); // temp debug

    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });

    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), '_blank');
  }

  async function handleSend(values) {
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: generateHTML(values),
        recipientEmail: values.recipientEmail,
        invoiceNumber: values.invoiceNumber
      })
    });

    const data = await res.json();
    if (data.success) alert('Invoice sent!');
    else alert(data.error || 'Something went wrong.');
  }

  return (
      <div className="app">
        <ThemeToggle />
        <InvoiceForm onPreview={handlePreview} onSend={handleSend} />
      </div>
  );
}

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { saveDraft, loadDraft } from '../hooks/useInvoiceDraft';
import LineItems from './LineItems';
import LogoUpload from './LogoUpload';

const defaultValues = {
  logo: null,
  invoiceNumber: '1',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  from: '',
  billTo: '',
  bankDetails: '',
  terms: '',
  recipientEmail: '',
  lineItems: [{ description: '', quantity: 1, rate: 0 }]
};

export default function InvoiceForm({ onPreview, onSend }) {
  const {
    register,
    control,
    setValue,
    reset,
    resetField,
    getValues,
    watch,
    trigger,
    formState: { errors }
  } = useForm({ defaultValues, mode: 'onChange' });

  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft) reset(draft);
    });
  }, [reset]);

  useEffect(() => {
    const subscription = watch(async (data) => {
      await saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const lineItems = watch('lineItems');

  function calcTotal(items = []) {
    return items
      .reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0)
      .toFixed(2);
  }

  async function handlePreview() {
    const valid = await trigger('recipientEmail');
    if (valid) onPreview(getValues());
  }

  async function handleSend() {
    const valid = await trigger('recipientEmail');
    if (valid) onSend(getValues());
  }

  return (
    <form className="invoice-form">
      <div className="invoice-header">
        <LogoUpload
          value={getValues('logo')}
          onChange={(val) => setValue('logo', val)}
        />
        <div className="invoice-meta">
          <h1>INVOICE</h1>
          <div className="invoice-meta-row">
            <label>#</label>
            <input {...register('invoiceNumber')} />
          </div>
          <div className="invoice-meta-row">
            <label>Date</label>
            <input type="date" {...register('date')} />
          </div>
          <div className="invoice-meta-row">
            <label>Due Date</label>
            <input type="date" {...register('dueDate')} />
          </div>
        </div>
      </div>

      <div className="invoice-parties">
        <div className="invoice-from">
          <label>From</label>
          <textarea {...register('from')} placeholder="Your name and address" rows={5} />
        </div>
        <div className="invoice-billto">
          <label>Bill To</label>
          <textarea {...register('billTo')} placeholder="Client name and address" rows={5} />
        </div>
      </div>

      <LineItems control={control} register={register} />

      <div className="invoice-total">
        <span>Total</span>
        <span>${calcTotal(lineItems)}</span>
      </div>

      <div className="invoice-footer">
        <div>
          <label>Bank Details</label>
          <textarea {...register('bankDetails')} placeholder="Beneficiary, routing, SWIFT..." rows={5} />
        </div>
        <div>
          <label>Terms</label>
          <textarea {...register('terms')} placeholder="Terms and conditions..." rows={5} />
        </div>
      </div>

      <div className="invoice-actions">
        <div className="invoice-actions-email">
          <input
            {...register('recipientEmail', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address'
              },
              onBlur: (e) =>{
                if (!e.target.value) resetField('recipientEmail');
                else trigger('recipientEmail');
              }
            })}
            type="email"
            placeholder="Recipient email"
            style={{ borderColor: errors.recipientEmail ? 'var(--danger)' : '' }}
          />
          {errors.recipientEmail && (
            <span className="field-tooltip">{errors.recipientEmail.message}</span>
          )}
        </div>
        <button type="button" onClick={handlePreview}>
          Preview PDF
        </button>
        <button type="button" onClick={handleSend}>
          Send Invoice
        </button>
      </div>
    </form>
  );
}

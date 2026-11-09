import { CURRENCY_GROUPS, TAX_ID_TYPES, formatMoney } from '../currency'
import { NO_AUTOFILL } from '../no-autofill'
import { useTaxIdInput } from '../hooks/use-tax-id-input'
import { useT } from '../hooks/use-t'
import { invoiceTotal, useInvoiceStore } from '../stores/invoice-store'
import { InvoiceActions } from './invoice-actions'
import { DateField } from './date-field'
import { LineItems } from './line-items'
import { LogoUpload } from './logo-upload'
import { SavedField } from './saved-field'
import { Select } from './select'

function Field({ name, label, ...props }) {
  const value = useInvoiceStore((s) => s.invoice[name])
  const setField = useInvoiceStore((s) => s.setField)
  const Tag = props.rows ? 'textarea' : 'input'
  return (
    <label className="field">
      <span>{label}</span>
      <Tag value={value} onChange={(e) => setField(name, e.target.value)} {...NO_AUTOFILL} {...props} />
    </label>
  )
}

function CurrencySelect() {
  const { t } = useT()
  const currency = useInvoiceStore((s) => s.currency)
  const setCurrency = useInvoiceStore((s) => s.setCurrency)
  return (
    <div className="field">
      <span>{t.currency}</span>
      <Select
        aria-label={t.currency}
        value={currency}
        onValueChange={setCurrency}
        groups={CURRENCY_GROUPS.map((group) => group.map((code) => ({ value: code, label: `${code} · ${t.currencies[code]}` })))}
      />
    </div>
  )
}

function TaxIdField() {
  const { t } = useT()
  const { typeProps, inputProps } = useTaxIdInput()
  return (
    <div className="field">
      <span>
        {t.taxId} <span className="optional">({t.optional})</span>
      </span>
      <div className="tax-id-row">
        <Select {...typeProps} groups={[TAX_ID_TYPES.map((code) => ({ value: code, label: t.taxIdTypes[code] }))]} />
        <input {...inputProps} />
      </div>
    </div>
  )
}

export function InvoiceForm() {
  const { t } = useT()
  const total = useInvoiceStore((s) => invoiceTotal(s.invoice.lineItems))
  const currency = useInvoiceStore((s) => s.currency)
  const resetInvoice = useInvoiceStore((s) => s.resetInvoice)

  return (
    <form className="invoice-form" onSubmit={(e) => e.preventDefault()}>
      <div className="invoice-header">
        <LogoUpload />
        <div className="invoice-meta">
          <h1>{t.invoice}</h1>
          <Field name="invoiceNumber" label={t.number} />
          <DateField name="date" label={t.date} />
          <DateField name="dueDate" label={t.dueDate} />
          <CurrencySelect />
        </div>
      </div>

      <div className="two-columns">
        <div className="stack">
          <Field name="from" label={t.from} rows={5} placeholder={t.fromPlaceholder} />
          <TaxIdField />
        </div>
        <SavedField name="billTo" label={t.billTo} rows={5} placeholder={t.billToPlaceholder} />
      </div>

      <LineItems />

      <div className="invoice-total">
        <span>{t.total}</span>
        <span>{formatMoney(total, currency)}</span>
      </div>

      <div className="two-columns">
        <SavedField name="bankDetails" label={t.bankDetails} rows={5} placeholder={t.bankDetailsPlaceholder} />
        <Field name="terms" label={t.terms} rows={5} placeholder={t.termsPlaceholder} />
      </div>

      <InvoiceActions />

      <button type="button" className="text-button reset" onClick={() => confirm(t.startOverConfirm) && resetInvoice()}>
        {t.startOver}
      </button>
    </form>
  )
}

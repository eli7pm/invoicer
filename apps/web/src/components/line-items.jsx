import { Plus, X } from 'lucide-react'
import { formatMoney } from '../currency'
import { useAmountInput } from '../hooks/use-amount-input'
import { useT } from '../hooks/use-t'
import { NO_AUTOFILL } from '../no-autofill'
import { lineTotal, useInvoiceStore } from '../stores/invoice-store'

function RateInput({ item, currency, label }) {
  const setLineItem = useInvoiceStore((s) => s.setLineItem)
  const props = useAmountInput(item.rate, currency, (rate) => setLineItem(item.id, 'rate', rate))
  return <input {...NO_AUTOFILL} aria-label={label} placeholder="0" {...props} />
}

export function LineItems() {
  const { t } = useT()
  const items = useInvoiceStore((s) => s.invoice.lineItems)
  const currency = useInvoiceStore((s) => s.currency)
  const setLineItem = useInvoiceStore((s) => s.setLineItem)
  const addLineItem = useInvoiceStore((s) => s.addLineItem)
  const removeLineItem = useInvoiceStore((s) => s.removeLineItem)

  return (
    <div className="line-items">
      <table>
        <colgroup>
          <col />
          <col className="quantity" />
          <col className="rate" />
          <col className="amount" />
          <col className="remove" />
        </colgroup>
        <thead>
          <tr>
            <th>{t.item}</th>
            <th>{t.quantity}</th>
            <th>{t.rate}</th>
            <th>{t.amount}</th>
            <th aria-label={t.remove} />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input {...NO_AUTOFILL} aria-label={t.item} value={item.description} placeholder={t.itemPlaceholder} onChange={(e) => setLineItem(item.id, 'description', e.target.value)} />
              </td>
              <td data-label={t.quantity}>
                <input aria-label={t.quantity} type="number" min="0" value={item.quantity} onChange={(e) => setLineItem(item.id, 'quantity', e.target.valueAsNumber || 0)} />
              </td>
              <td data-label={t.rate}>
                <RateInput item={item} currency={currency} label={t.rate} />
              </td>
              <td className="amount" data-label={t.amount}>{formatMoney(lineTotal(item), currency)}</td>
              <td>
                <button type="button" className="icon-button danger" onClick={() => removeLineItem(item.id)} aria-label={t.removeLineItem}>
                  <X size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="secondary-button" onClick={addLineItem}>
        <Plus size={14} /> {t.addLineItem}
      </button>
    </div>
  )
}

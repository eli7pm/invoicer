import { useState } from 'react'
import { Download, FileText, LoaderCircle } from 'lucide-react'
import { formatMoney } from '../currency'
import { useSlow } from '../hooks/use-slow'
import { useT } from '../hooks/use-t'
import { LOCALES } from '../i18n'
import { fetchPdf, pdfFileName, savePdf } from '../pdf-api'
import { invoiceTotal } from '../stores/invoice-store'

const firstLine = (text) => (text || '').split('\n')[0]

export function SharedInvoice({ invoice }) {
  const { t, lang } = useT()
  const [action, setAction] = useState(null)
  const [error, setError] = useState(null)
  const slow = useSlow(action !== null)
  const pdfT = invoice.lang === 'es' ? 'factura' : 'invoice'

  const getPdf = async (name) => {
    setAction(name)
    setError(null)
    const result = await fetchPdf(invoice)
    setAction(null)
    if (result.error) setError(result.error)
    return result.url
  }

  const onView = async () => {
    const tab = window.open('', '_blank')
    const url = await getPdf('view')
    if (url && tab) tab.location.href = url
    else if (url) window.location.href = url
    else tab?.close()
  }

  const onDownload = async () => {
    const url = await getPdf('download')
    if (url) savePdf(url, pdfFileName(pdfT, invoice.invoiceNumber))
  }

  const icon = (name, Icon) => (action === name ? <LoaderCircle size={14} className="spin" /> : <Icon size={14} />)
  const date = (iso) => (iso ? new Date(`${iso}T00:00`).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' }) : null)

  return (
    <section className="shared-invoice">
      <p className="shared-eyebrow">{t.sharedEyebrow}</p>
      <h1>
        {t.invoice}{' '}
        {invoice.invoiceNumber && <span className="nowrap">{`${t.number} ${invoice.invoiceNumber}`}</span>}
      </h1>
      <dl className="shared-details">
        {invoice.from && (
          <div>
            <dt>{t.from}</dt>
            <dd>{firstLine(invoice.from)}</dd>
          </div>
        )}
        {invoice.billTo && (
          <div>
            <dt>{t.billTo}</dt>
            <dd>{firstLine(invoice.billTo)}</dd>
          </div>
        )}
        {invoice.dueDate && (
          <div>
            <dt>{t.dueDate}</dt>
            <dd>{date(invoice.dueDate)}</dd>
          </div>
        )}
        <div className="shared-total">
          <dt>{t.total}</dt>
          <dd>{formatMoney(invoiceTotal(invoice.lineItems), invoice.currency)}</dd>
        </div>
      </dl>
      <div className="actions-row">
        <button type="button" className="primary-button" onClick={onView} disabled={action !== null}>
          {icon('view', FileText)} {t.viewPdf}
        </button>
        <button type="button" className="secondary-button" onClick={onDownload} disabled={action !== null}>
          {icon('download', Download)} {t.downloadPdf}
        </button>
      </div>
      {slow && (
        <p className="note" role="status">
          {t.waking}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {t.errors[error] ?? t.errors.generic}
        </p>
      )}
      <a className="text-button shared-own" href={import.meta.env.BASE_URL}>
        {t.makeYourOwn}
      </a>
    </section>
  )
}

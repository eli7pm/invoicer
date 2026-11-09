import { useState } from 'react'
import { Download, FileText, LoaderCircle, MessageCircle, Send } from 'lucide-react'
import { SEND_ENABLED } from '../config'
import { NO_AUTOFILL } from '../no-autofill'
import { formatMoney } from '../currency'
import { useSlow } from '../hooks/use-slow'
import { useT } from '../hooks/use-t'
import { createShortLink, pdfFileName, savePdf } from '../pdf-api'
import { invoiceToLinkData, SHARE_HASH, SHARE_PARAM, shrinkLogo } from '../share-link'
import { invoicePayload, invoiceTotal, useInvoiceStore } from '../stores/invoice-store'

export function InvoiceActions() {
  const { t, lang } = useT()
  const recipientEmail = useInvoiceStore((s) => s.invoice.recipientEmail)
  const shareMessage = useInvoiceStore((s) => s.invoice.shareMessage) ?? ''
  const invoiceNumber = useInvoiceStore((s) => s.invoice.invoiceNumber)
  const setField = useInvoiceStore((s) => s.setField)
  const preview = useInvoiceStore((s) => s.preview)
  const previewPdf = useInvoiceStore((s) => s.previewPdf)
  const [action, setAction] = useState(null)
  const [longLink, setLongLink] = useState(false)
  const loading = preview.status === 'loading'
  const slow = useSlow(loading)

  const run = async (name, task) => {
    setAction(name)
    try {
      await task()
    } finally {
      setAction(null)
    }
  }

  const onPreview = () =>
    run('preview', async () => {
      const tab = window.open('', '_blank')
      const url = await previewPdf()
      if (url && tab) tab.location.href = url
      else if (url) window.location.href = url
      else tab?.close()
    })

  const onDownload = () =>
    run('download', async () => {
      const url = await previewPdf()
      if (url) savePdf(url, pdfFileName(t.fileName, invoiceNumber))
    })

  const onWhatsApp = () =>
    run('whatsapp', async () => {
      const tab = window.open('', '_blank')
      const state = useInvoiceStore.getState()
      const payload = invoicePayload(state)
      const base = `${location.origin}${import.meta.env.BASE_URL}?lang=${lang}`
      let link
      try {
        const logo = payload.logo ? await shrinkLogo(payload.logo).catch(() => null) : null
        link = `${base}&${SHARE_PARAM}=${await createShortLink({ ...payload, logo })}`
        setLongLink(false)
      } catch {
        setLongLink(true)
        link = `${base}${SHARE_HASH}${await invoiceToLinkData(payload)}`
      }
      const shown = location.hostname === 'localhost' ? link.replace(/^http:\/\//, '') : link
      const summary = t.whatsappMessage(payload.invoiceNumber, formatMoney(invoiceTotal(payload.lineItems), payload.currency))
      const text = [state.invoice.shareMessage?.trim(), summary, shown].filter(Boolean).join('\n')
      const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`
      if (tab) tab.location.href = whatsapp
      else window.location.href = whatsapp
    })

  const spinnerOr = (name, icon) => (action === name && (loading || name === 'whatsapp') ? <LoaderCircle size={14} className="spin" /> : icon)

  return (
    <div className="invoice-actions">
      <div className="field">
        <label htmlFor="share-message">
          {t.shareMessage} <span className="optional">({t.optional})</span>
        </label>
        <div className="whatsapp-row">
          <textarea
            {...NO_AUTOFILL}
            id="share-message"
            rows={2}
            value={shareMessage}
            placeholder={t.shareMessagePlaceholder}
            maxLength={1000}
            onChange={(e) => setField('shareMessage', e.target.value)}
          />
          <button type="button" className="secondary-button" onClick={onWhatsApp} disabled={action === 'whatsapp'}>
            {spinnerOr('whatsapp', <MessageCircle size={14} />)}
            {t.whatsapp}
          </button>
        </div>
      </div>
      <div className="actions-row">
        <input
          type="email"
          aria-label={t.recipientEmail}
          placeholder={t.recipientEmail}
          value={recipientEmail}
          onChange={(e) => setField('recipientEmail', e.target.value)}
          disabled={!SEND_ENABLED}
        />
        <button type="button" className="secondary-button" onClick={onPreview} disabled={loading}>
          {spinnerOr('preview', <FileText size={14} />)}
          {t.previewPdf}
        </button>
        <button type="button" className="secondary-button" onClick={onDownload} disabled={loading}>
          {spinnerOr('download', <Download size={14} />)}
          {t.downloadPdf}
        </button>
        <button type="button" className="primary-button" disabled={!SEND_ENABLED} aria-describedby={SEND_ENABLED ? undefined : 'send-note'}>
          <Send size={14} /> {t.sendInvoice}
        </button>
      </div>
      {slow && (
        <p className="note" role="status">
          {t.waking}
        </p>
      )}
      {longLink && (
        <p className="note" role="status">
          {t.longLink}
        </p>
      )}
      {preview.error && (
        <p className="error" role="alert">
          {t.errors[preview.error] ?? t.errors.generic}
        </p>
      )}
      {!SEND_ENABLED && (
        <p id="send-note" className="note">
          {t.sendDisabled}
        </p>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { InvoiceForm } from './components/invoice-form'
import { SharedInvoice } from './components/shared-invoice'
import { SiteHeader } from './components/site-header'
import { useT } from './hooks/use-t'
import { loadSharedInvoice } from './pdf-api'
import { linkDataToInvoice, SHARE_HASH, SHARE_ID, SHARE_PARAM } from './share-link'

function useSharedInvoice() {
  const read = () => {
    const id = new URLSearchParams(location.search).get(SHARE_PARAM)
    if (id) return `id:${id}`
    return location.hash.startsWith(SHARE_HASH) ? location.hash.slice(SHARE_HASH.length) : null
  }
  const [data, setData] = useState(read)
  const [shared, setShared] = useState({ data: null })

  useEffect(() => {
    const onHash = () => setData(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!data) return
    let cancelled = false
    const load = data.startsWith('id:')
      ? SHARE_ID.test(data.slice(3))
        ? loadSharedInvoice(data.slice(3))
        : Promise.resolve({ error: 'expired' })
      : linkDataToInvoice(data).then((invoice) => (invoice ? { invoice } : { error: 'broken' }))
    load.then((result) => !cancelled && setShared({ data, ...result }))
    return () => {
      cancelled = true
    }
  }, [data])

  if (!data) return { mode: 'form' }
  if (shared.data !== data) return { mode: 'loading' }
  return shared.invoice ? { mode: 'shared', invoice: shared.invoice } : { mode: 'broken', reason: shared.error }
}

export default function App() {
  const { t } = useT()
  const shared = useSharedInvoice()

  return (
    <div className="app">
      <SiteHeader />
      <main>
        {shared.mode === 'form' && <InvoiceForm />}
        {shared.mode === 'shared' && <SharedInvoice invoice={shared.invoice} />}
        {shared.mode === 'broken' && (
          <section className="shared-invoice">
            <h1>{shared.reason === 'expired' ? t.expiredLinkTitle : shared.reason === 'offline' ? t.offlineLinkTitle : t.brokenLinkTitle}</h1>
            <p className="note">{shared.reason === 'expired' ? t.expiredLink : shared.reason === 'offline' ? t.errors.offline : t.brokenLink}</p>
            <a className="text-button shared-own" href={import.meta.env.BASE_URL}>
              {t.makeYourOwn}
            </a>
          </section>
        )}
      </main>
      <footer className="site-footer">
        {t.footerBuiltBy} <a href="https://eli7pm.me/">Eli Payano</a> · {t.footerStack} ·{' '}
        <a href="https://github.com/eli7pm/invoicer">{t.footerSource}</a>
      </footer>
    </div>
  )
}

import { API_URL } from './config'

const ERROR_KEYS = { 400: 'invalid', 413: 'tooLarge', 429: 'tooMany', 503: 'busy' }

export async function fetchPdf(invoice) {
  try {
    const res = await fetch(`${API_URL}/api/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice }),
    })
    if (!res.ok) return { error: ERROR_KEYS[res.status] ?? 'generic' }
    return { url: URL.createObjectURL(await res.blob()) }
  } catch {
    return { error: 'offline' }
  }
}

export function savePdf(url, fileName) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function pdfFileName(prefix, invoiceNumber) {
  const safe = String(invoiceNumber || '').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '')
  return `${prefix}${safe ? `-${safe}` : ''}.pdf`
}

export async function createShortLink(invoice) {
  const res = await fetch(`${API_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice }),
  })
  if (!res.ok) throw new Error(`share failed: ${res.status}`)
  return (await res.json()).id
}

export async function loadSharedInvoice(id) {
  try {
    const res = await fetch(`${API_URL}/api/share/${id}`)
    if (res.status === 404) return { error: 'expired' }
    if (!res.ok) return { error: 'offline' }
    return { invoice: (await res.json()).invoice }
  } catch {
    return { error: 'offline' }
  }
}

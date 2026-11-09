const FIELDS = ['invoiceNumber', 'date', 'dueDate', 'from', 'fromTaxId', 'fromTaxIdType', 'billTo', 'bankDetails', 'terms', 'currency', 'lang']
const MAX_LINK_DATA = 24_000

const toBase64Url = (bytes) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text) => {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer())

export async function shrinkLogo(dataUrl) {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const scale = Math.min(1, 320 / img.width, 200 / img.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/webp', 0.8)
}

async function encode(data) {
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(data)), new CompressionStream('deflate-raw'))
  return toBase64Url(bytes)
}

export async function invoiceToLinkData(invoice) {
  const data = { v: 1, lineItems: invoice.lineItems.map(({ description, quantity, rate }) => [description, quantity, rate]) }
  for (const field of FIELDS) if (invoice[field]) data[field] = invoice[field]

  if (invoice.logo) {
    try {
      const withLogo = await encode({ ...data, logo: await shrinkLogo(invoice.logo) })
      if (withLogo.length <= MAX_LINK_DATA) return withLogo
    } catch {
      /* fall through without the logo */
    }
  }
  return encode(data)
}

export async function linkDataToInvoice(text) {
  try {
    if (!text || text.length > 200_000) return null
    const bytes = await pipe(fromBase64Url(text), new DecompressionStream('deflate-raw'))
    const data = JSON.parse(new TextDecoder().decode(bytes))
    if (data?.v !== 1 || !Array.isArray(data.lineItems)) return null
    const invoice = { lineItems: data.lineItems.slice(0, 50).map(([description, quantity, rate]) => ({ description, quantity, rate })) }
    for (const field of [...FIELDS, 'logo']) if (typeof data[field] === 'string') invoice[field] = data[field]
    return invoice
  } catch {
    return null
  }
}

export const SHARE_HASH = '#i='
export const SHARE_PARAM = 'i'
export const SHARE_ID = /^[2-9a-km-zA-HJ-NP-Z]{8}$/

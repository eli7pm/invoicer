export const CURRENCY_SYMBOLS = { USD: 'US$', EUR: '€', DOP: 'RD$', CAD: 'CA$', MXN: 'MX$', COP: 'COL$', BRL: 'R$' }

export const CURRENCY_LOCALES = { USD: 'en-US', EUR: 'de-DE', DOP: 'es-DO', CAD: 'en-CA', MXN: 'es-MX', COP: 'es-CO', BRL: 'pt-BR' }

export const CURRENCY_GROUPS = [
  ['USD', 'EUR', 'DOP'],
  ['CAD', 'MXN', 'COP', 'BRL'],
]

export const CURRENCIES = CURRENCY_GROUPS.flat()

export const DEFAULT_CURRENCY = 'USD'

export const TAX_ID_TYPES = ['OTHER', 'RNC', 'CEDULA', 'RFC', 'NIT', 'CNPJ', 'CPF', 'BN', 'EIN', 'VAT']

export const DEFAULT_TAX_ID_TYPE = 'OTHER'

const localeOf = (currency) => CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES[DEFAULT_CURRENCY]

export function formatMoney(value, currency) {
  const parts = new Intl.NumberFormat(localeOf(currency), {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(Number(value) || 0)
  const symbolFirst = parts.findIndex((p) => p.type === 'currency') < parts.findIndex((p) => p.type === 'integer')
  return parts
    .map((part) => {
      if (part.type === 'currency') return CURRENCY_SYMBOLS[currency]
      if (part.type === 'literal' && /^\s+$/.test(part.value)) return symbolFirst ? '' : ' '
      return part.value
    })
    .join('')
}

export function numberSeparators(currency) {
  const parts = new Intl.NumberFormat(localeOf(currency)).formatToParts(11111.1)
  return { group: parts.find((p) => p.type === 'group').value, decimal: parts.find((p) => p.type === 'decimal').value }
}

export function parseAmountInput(raw, currency) {
  const { decimal } = numberSeparators(currency)
  const cleaned = raw.replace(new RegExp(`[^0-9${decimal === '.' ? '\\.' : decimal}]`, 'g'), '')
  const [whole = '', ...rest] = cleaned.split(decimal)
  const integer = whole.replace(/^0+(?=\d)/, '')
  const fraction = rest.join('').slice(0, 2)
  const hasDecimal = cleaned.includes(decimal)
  const { group } = numberSeparators(currency)
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  return {
    text: (grouped || (hasDecimal ? '0' : '')) + (hasDecimal ? decimal + fraction : ''),
    value: Number(`${integer || 0}.${fraction || 0}`),
  }
}

export function formatAmountInput(value, currency) {
  if (!value) return ''
  return new Intl.NumberFormat(localeOf(currency), { maximumFractionDigits: 2 }).format(value)
}

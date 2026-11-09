import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { fetchPdf } from '../pdf-api'
import { CURRENCIES, DEFAULT_CURRENCY, DEFAULT_TAX_ID_TYPE } from '../currency'
import { readParam, syncParam } from '../url-params'
import { useLocaleStore } from './locale-store'

const urlCurrency = () => readParam('currency', CURRENCIES, (v) => v.toUpperCase())

const today = () => new Date().toISOString().split('T')[0]
const emptyItem = () => ({ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 })

const blankInvoice = () => ({
  logo: null,
  invoiceNumber: '1',
  date: today(),
  dueDate: '',
  from: '',
  fromTaxIdType: DEFAULT_TAX_ID_TYPE,
  fromTaxId: '',
  billTo: '',
  bankDetails: '',
  terms: '',
  recipientEmail: '',
  shareMessage: '',
  lineItems: [emptyItem()],
})

const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      return
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      return
    }
  },
}

export const lineTotal = (item) => (Number(item.quantity) || 0) * (Number(item.rate) || 0)
export const invoiceTotal = (items) => items.reduce((sum, item) => sum + lineTotal(item), 0)

export function invoicePayload(state) {
  const { logo, invoiceNumber, date, dueDate, from, fromTaxId, fromTaxIdType, billTo, bankDetails, terms, lineItems } = state.invoice
  return {
    logo,
    invoiceNumber,
    date,
    dueDate,
    from,
    fromTaxId,
    fromTaxIdType: fromTaxIdType ?? DEFAULT_TAX_ID_TYPE,
    billTo,
    bankDetails,
    terms,
    lineItems: lineItems.map(({ description, quantity, rate }) => ({ description, quantity, rate })),
    currency: state.currency,
    lang: useLocaleStore.getState().lang,
  }
}

export const useInvoiceStore = create()(
  persist(
    (set, get) => ({
      invoice: blankInvoice(),
      currency: urlCurrency() ?? DEFAULT_CURRENCY,
      preview: { status: 'idle', error: null },

      setCurrency: (currency) => {
        if (!CURRENCIES.includes(currency)) return
        syncParam('currency', currency.toLowerCase())
        set({ currency })
      },

      setField: (field, value) => set((s) => ({ invoice: { ...s.invoice, [field]: value } })),
      setLineItem: (id, field, value) =>
        set((s) => ({
          invoice: {
            ...s.invoice,
            lineItems: s.invoice.lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
          },
        })),
      addLineItem: () => set((s) => ({ invoice: { ...s.invoice, lineItems: [...s.invoice.lineItems, emptyItem()] } })),
      removeLineItem: (id) =>
        set((s) => {
          const lineItems = s.invoice.lineItems.filter((item) => item.id !== id)
          return { invoice: { ...s.invoice, lineItems: lineItems.length ? lineItems : [emptyItem()] } }
        }),
      resetInvoice: () => set({ invoice: blankInvoice(), preview: { status: 'idle', error: null } }),

      previewPdf: async () => {
        set({ preview: { status: 'loading', error: null } })
        const { url, error } = await fetchPdf(invoicePayload(get()))
        set({ preview: { status: error ? 'error' : 'idle', error: error ?? null } })
        return url ?? null
      },
    }),
    {
      name: 'invoicer-draft',
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ invoice: state.invoice, currency: state.currency }),
      merge: (saved, current) => ({ ...current, ...saved, currency: urlCurrency() ?? saved?.currency ?? current.currency }),
    },
  ),
)

if (urlCurrency()) useInvoiceStore.getState().setCurrency(urlCurrency())

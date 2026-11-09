import { useLayoutEffect, useRef } from 'react'
import { DEFAULT_TAX_ID_TYPE } from '../currency'
import { TAX_ID_PLACEHOLDERS } from '../i18n'
import { NO_AUTOFILL } from '../no-autofill'
import { useInvoiceStore } from '../stores/invoice-store'
import { caretAfterFormat, formatTaxId, isNumericTaxId } from '../tax-id'
import { useT } from './use-t'

export function useTaxIdInput() {
  const { t } = useT()
  const type = useInvoiceStore((s) => s.invoice.fromTaxIdType) ?? DEFAULT_TAX_ID_TYPE
  const value = useInvoiceStore((s) => s.invoice.fromTaxId)
  const setField = useInvoiceStore((s) => s.setField)
  const inputRef = useRef(null)
  const pendingCaret = useRef(null)

  useLayoutEffect(() => {
    const el = inputRef.current
    const caret = pendingCaret.current
    pendingCaret.current = null
    if (el && caret !== null && document.activeElement === el) el.setSelectionRange(caret, caret)
  })

  const onChange = (e) => {
    let raw = e.target.value
    let caret = e.target.selectionStart ?? raw.length
    let next = formatTaxId(type, raw)

    if (type !== 'OTHER' && next === value && raw.length < value.length) {
      const before = raw.slice(0, caret).search(/[A-Za-z0-9Ñ&](?=[^A-Za-z0-9Ñ&]*$)/)
      if (before !== -1) {
        raw = raw.slice(0, before) + raw.slice(before + 1)
        caret = before
        next = formatTaxId(type, raw)
      }
    }

    pendingCaret.current = type === 'OTHER' ? caret : caretAfterFormat(raw, caret, next)
    setField('fromTaxId', next)
  }

  const onTypeChange = (next) => {
    setField('fromTaxIdType', next)
    setField('fromTaxId', formatTaxId(next, value))
  }

  return {
    type,
    typeProps: { value: type, onValueChange: onTypeChange, 'aria-label': t.taxIdType },
    inputProps: {
      ...NO_AUTOFILL,
      ref: inputRef,
      value,
      onChange,
      maxLength: 40,
      inputMode: isNumericTaxId(type) ? 'numeric' : 'text',
      autoCapitalize: type === 'OTHER' ? 'off' : 'characters',
      spellCheck: false,
      placeholder: TAX_ID_PLACEHOLDERS[type],
      'aria-label': t.taxIdNumber,
    },
  }
}

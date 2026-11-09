import { useLayoutEffect, useRef, useState } from 'react'
import { formatAmountInput, numberSeparators, parseAmountInput } from '../currency'

function caretAfter(raw, caret, formatted, decimal) {
  const counts = (ch) => /\d/.test(ch) || ch === decimal
  let wanted = 0
  for (let i = 0; i < caret; i++) if (counts(raw[i])) wanted++
  if (wanted === 0) return 0
  for (let i = 0; i < formatted.length; i++) if (counts(formatted[i]) && --wanted === 0) return i + 1
  return formatted.length
}

export function useAmountInput(value, currency, onValueChange) {
  const [draft, setDraft] = useState({ text: '', value: null, currency: null })
  const inputRef = useRef(null)
  const pendingCaret = useRef(null)

  useLayoutEffect(() => {
    const el = inputRef.current
    const caret = pendingCaret.current
    pendingCaret.current = null
    if (el && caret !== null && document.activeElement === el) el.setSelectionRange(caret, caret)
  })

  const text = draft.value === value && draft.currency === currency ? draft.text : formatAmountInput(value, currency)

  const onChange = (e) => {
    const { decimal, group } = numberSeparators(currency)
    let raw = e.target.value
    let caret = e.target.selectionStart ?? raw.length

    if (raw.length === text.length - 1 && text[caret] === group && raw[caret] !== group) {
      raw = raw.slice(0, caret - 1) + raw.slice(caret)
      caret -= 1
    }

    const next = parseAmountInput(raw, currency)
    pendingCaret.current = caretAfter(raw, caret, next.text, decimal)
    setDraft({ text: next.text, value: next.value, currency })
    onValueChange(next.value)
  }

  return { ref: inputRef, value: text, onChange, inputMode: 'decimal', autoComplete: 'off' }
}

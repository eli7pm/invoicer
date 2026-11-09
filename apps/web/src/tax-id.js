const DIGIT_MASKS = {
  RNC: '#-##-#####-#',
  CEDULA: '###-#######-#',
  NIT: '###.###.###-#',
  CNPJ: '##.###.###/####-##',
  CPF: '###.###.###-##',
  EIN: '##-#######',
  BN: '#########',
}

const ALNUM_LIMITS = { RFC: 13, VAT: 14 }

function applyMask(digits, mask) {
  let out = ''
  let i = 0
  for (const char of mask) {
    if (i >= digits.length) break
    if (char === '#') out += digits[i++]
    else out += char
  }
  return out
}

export const isNumericTaxId = (type) => type in DIGIT_MASKS

export function formatTaxId(type, value) {
  const raw = String(value ?? '')
  if (type in DIGIT_MASKS) {
    const mask = DIGIT_MASKS[type]
    const max = mask.split('#').length - 1
    return applyMask(raw.replace(/\D/g, '').slice(0, max), mask)
  }
  if (type in ALNUM_LIMITS) {
    return raw.toUpperCase().replace(/[^A-Z0-9Ñ&]/g, '').slice(0, ALNUM_LIMITS[type])
  }
  return raw.slice(0, 40)
}

const SIGNIFICANT = /[A-Za-z0-9Ñ&]/

export function caretAfterFormat(raw, caret, formatted) {
  let significant = 0
  for (let i = 0; i < caret; i++) if (SIGNIFICANT.test(raw[i])) significant++
  if (significant === 0) return 0
  for (let i = 0; i < formatted.length; i++) {
    if (SIGNIFICANT.test(formatted[i]) && --significant === 0) return i + 1
  }
  return formatted.length
}

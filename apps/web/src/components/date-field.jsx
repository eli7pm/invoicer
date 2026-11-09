import { Popover } from '@base-ui/react/popover'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { enUS, es } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { useT } from '../hooks/use-t'
import { LOCALES } from '../i18n'
import { useInvoiceStore } from '../stores/invoice-store'

const DAY_PICKER_LOCALES = { en: enUS, es }

const toDate = (iso) => {
  const [y, m, d] = (iso || '').split('-').map(Number)
  return y && m && d ? new Date(y, m - 1, d) : undefined
}

const toIso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function DateField({ name, label }) {
  const { t, lang } = useT()
  const value = useInvoiceStore((s) => s.invoice[name])
  const setField = useInvoiceStore((s) => s.setField)
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const shown = selected
    ? new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(selected)
    : t.pickDate

  return (
    <div className="field">
      <span>{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger className={`select-trigger date-trigger${selected ? '' : ' is-empty'}`} aria-label={`${label}: ${shown}`}>
          <span className="select-value">{shown}</span>
          <CalendarDays size={14} className="select-icon" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner className="select-positioner" sideOffset={6} align="end">
            <Popover.Popup className="select-popup calendar-popup">
              <DayPicker
                mode="single"
                locale={DAY_PICKER_LOCALES[lang]}
                selected={selected}
                defaultMonth={selected}
                onSelect={(date) => {
                  setField(name, date ? toIso(date) : '')
                  setOpen(false)
                }}
              />
              {selected && (
                <button type="button" className="text-button calendar-clear" onClick={() => (setField(name, ''), setOpen(false))}>
                  {t.clearDate}
                </button>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

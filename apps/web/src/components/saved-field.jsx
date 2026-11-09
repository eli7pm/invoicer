import { Bookmark, BookmarkX } from 'lucide-react'
import { useId } from 'react'
import { useT } from '../hooks/use-t'
import { NO_AUTOFILL } from '../no-autofill'
import { useInvoiceStore } from '../stores/invoice-store'
import { useSavedStore } from '../stores/saved-store'
import { Select } from './select'

const firstLine = (text) => text.split('\n')[0].slice(0, 60)

export function SavedField({ name, label, ...props }) {
  const { t } = useT()
  const id = useId()
  const value = useInvoiceStore((s) => s.invoice[name])
  const setField = useInvoiceStore((s) => s.setField)
  const saved = useSavedStore((s) => s[name])
  const save = useSavedStore((s) => s.save)
  const remove = useSavedStore((s) => s.remove)
  const isSaved = value.trim() !== '' && saved.includes(value.trim())

  return (
    <div className="field">
      <div className="field-header">
        <label htmlFor={id}>{label}</label>
        <div className="saved-actions">
          {saved.length > 0 && (
            <Select
              className="compact"
              aria-label={t.savedPick(label)}
              value={isSaved ? value.trim() : null}
              placeholder={t.saved(saved.length)}
              onValueChange={(entry) => entry && setField(name, entry)}
              groups={[saved.map((entry) => ({ value: entry, label: firstLine(entry) }))]}
            />
          )}
          {isSaved ? (
            <button type="button" className="text-button" onClick={() => remove(name, value)}>
              <BookmarkX size={14} aria-hidden="true" /> {t.forget}
            </button>
          ) : (
            <button type="button" className="text-button" disabled={!value.trim()} onClick={() => save(name, value)}>
              <Bookmark size={14} aria-hidden="true" /> {t.save}
            </button>
          )}
        </div>
      </div>
      <textarea id={id} value={value} onChange={(e) => setField(name, e.target.value)} {...NO_AUTOFILL} {...props} />
    </div>
  )
}

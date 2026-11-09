import { ImagePlus, X } from 'lucide-react'
import { useT } from '../hooks/use-t'
import { useInvoiceStore } from '../stores/invoice-store'

const MAX_BYTES = 1024 * 1024

export function LogoUpload() {
  const { t } = useT()
  const logo = useInvoiceStore((s) => s.invoice.logo)
  const setField = useInvoiceStore((s) => s.setField)

  const onFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_BYTES) return alert(t.logoTooBig)
    const reader = new FileReader()
    reader.onload = () => setField('logo', reader.result)
    reader.readAsDataURL(file)
  }

  if (logo) {
    return (
      <div className="logo-upload logo-preview">
        <img src={logo} alt={t.logoAlt} />
        <button type="button" className="text-button" onClick={() => setField('logo', null)}>
          <X size={14} /> {t.remove}
        </button>
      </div>
    )
  }

  return (
    <label className="logo-upload logo-placeholder">
      <ImagePlus size={18} />
      {t.addLogo}
      <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={onFile} hidden />
    </label>
  )
}

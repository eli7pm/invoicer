import { messages } from '../i18n'
import { useLocaleStore } from '../stores/locale-store'

export function useT() {
  const lang = useLocaleStore((s) => s.lang)
  return { lang, t: messages[lang] }
}

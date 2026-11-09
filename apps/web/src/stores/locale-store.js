import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LANGS } from '../i18n'
import { readParam, syncParam } from '../url-params'

const browserLang = () => (navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en')
const urlLang = () => readParam('lang', LANGS)
const applyLang = (lang) => {
  document.documentElement.lang = lang
  syncParam('lang', lang)
}

export const useLocaleStore = create()(
  persist(
    (set) => ({
      lang: urlLang() ?? browserLang(),
      setLang: (lang) => {
        if (!LANGS.includes(lang)) return
        applyLang(lang)
        set({ lang })
      },
    }),
    {
      name: 'invoicer-locale',
      merge: (saved, current) => ({ ...current, ...saved, lang: urlLang() ?? saved?.lang ?? current.lang }),
      onRehydrateStorage: () => (state) => applyLang(state?.lang ?? browserLang()),
    },
  ),
)

if (urlLang()) useLocaleStore.getState().setLang(urlLang())

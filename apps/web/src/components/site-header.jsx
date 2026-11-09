import { MX, US } from 'country-flag-icons/react/3x2'
import { Moon, Sun } from 'lucide-react'
import { PORTFOLIO_URL } from '../config'
import { useT } from '../hooks/use-t'
import { LANGS } from '../i18n'
import { useLocaleStore } from '../stores/locale-store'
import { useThemeStore } from '../stores/theme-store'

const LANGUAGE_OPTIONS = {
  en: { Flag: US, name: 'English' },
  es: { Flag: MX, name: 'Español' },
}

export function SiteHeader() {
  const { t, lang } = useT()
  const setLang = useLocaleStore((s) => s.setLang)
  const dark = useThemeStore((s) => s.theme === 'dark')
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  return (
    <header className="site-header">
      <a href={PORTFOLIO_URL} className="brand" aria-label={t.backToPortfolio}>
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="32" height="32" />
        <span className="wordmark">
          eli<span className="wordmark-7">7</span>pm
        </span>
      </a>
      <span className="site-title">{t.title}</span>
      <div className="lang-switch" role="group" aria-label={t.language}>
        {LANGS.map((code) => {
          const { Flag, name } = LANGUAGE_OPTIONS[code]
          return (
            <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)} title={name} aria-label={name}>
              <Flag aria-hidden className="flag" />
            </button>
          )
        })}
      </div>
      <button type="button" className="icon-button" onClick={toggleTheme} aria-label={dark ? t.themeToLight : t.themeToDark}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}

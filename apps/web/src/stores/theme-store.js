import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const applyTheme = (theme) => document.documentElement.classList.toggle('dark', theme === 'dark')

function switchThemeInstantly(theme) {
  const pause = document.createElement('style')
  pause.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(pause)
  applyTheme(theme)
  void getComputedStyle(document.documentElement).color
  window.setTimeout(() => pause.remove(), 0)
}

export const useThemeStore = create()(
  persist(
    (set, get) => ({
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      toggleTheme: () => {
        const theme = get().theme === 'dark' ? 'light' : 'dark'
        switchThemeInstantly(theme)
        set({ theme })
      },
    }),
    {
      name: 'eli7pm-ui',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)

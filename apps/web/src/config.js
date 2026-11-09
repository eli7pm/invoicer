export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const SEND_ENABLED = import.meta.env.VITE_SEND_ENABLED === 'true'
export const PORTFOLIO_URL = import.meta.env.VITE_PORTFOLIO_URL ?? (import.meta.env.DEV ? 'http://localhost:5173/' : 'https://eli7pm.me/')

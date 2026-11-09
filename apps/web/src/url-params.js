export function readParam(name, allowed, normalize = (v) => v.toLowerCase()) {
  const raw = new URLSearchParams(location.search).get(name)
  if (!raw) return null
  const value = normalize(raw)
  return allowed.includes(value) ? value : null
}

export function syncParam(name, value) {
  const url = new URL(location.href)
  if (!url.searchParams.has(name) || url.searchParams.get(name) === value) return
  url.searchParams.set(name, value)
  history.replaceState(history.state, '', url)
}

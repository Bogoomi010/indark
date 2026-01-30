export type BackendMode = 'firebase' | 'server'

// Default policy:
// - Production (Vercel): firebase
// - Development: server if explicitly requested, else firebase
export function backendMode(): BackendMode {
  const raw = (import.meta as any).env?.VITE_BACKEND_MODE
  if (raw === 'server' || raw === 'firebase') return raw
  if ((import.meta as any).env?.PROD) return 'firebase'
  return 'firebase'
}

export function devLogEnabled(): boolean {
  // keep dev-only internal logging off in production
  return Boolean((import.meta as any).env?.DEV)
}

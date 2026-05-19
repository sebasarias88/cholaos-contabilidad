import toast from 'react-hot-toast'

/** GET JSON con toast de error estándar */
export async function fetchJson<T>(
  url: string,
  errorMessage = 'Error al cargar datos'
): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    return (await res.json()) as T
  } catch {
    toast.error(errorMessage)
    return null
  }
}

/** POST/PUT/DELETE con toast loading → success | error */
export async function mutateJson<T>(
  url: string,
  init: RequestInit,
  messages: { loading: string; success: string; error: string }
): Promise<T | null> {
  const id = toast.loading(messages.loading)
  try {
    const res = await fetch(url, init)
    if (!res.ok) throw new Error()
    const data = (await res.json()) as T
    toast.success(messages.success, { id })
    return data
  } catch {
    toast.error(messages.error, { id })
    return null
  }
}

import toast from 'react-hot-toast'

/**
 * Uso estándar (react-hot-toast):
 *
 * toast.success('Venta registrada correctamente')
 * toast.error('Error al guardar. Intenta de nuevo.')
 *
 * const id = toast.loading('Guardando venta...')
 * toast.success('Guardado', { id })
 * toast.error('Error', { id })
 *
 * toast('Producto actualizado', { icon: '✏️' })
 */

export { toast }

/** Éxito — opcionalmente reemplaza un toast.loading por id */
export function toastSuccess(message: string, id?: string) {
  return toast.success(message, id ? { id } : undefined)
}

/** Error */
export function toastError(message: string, id?: string) {
  return toast.error(message, id ? { id } : undefined)
}

/** Loading — guarda el id para success/error después */
export function toastLoading(message: string) {
  return toast.loading(message)
}

/** Mensaje custom con ícono */
export function toastCustom(message: string, icon = 'ℹ️') {
  return toast(message, { icon })
}

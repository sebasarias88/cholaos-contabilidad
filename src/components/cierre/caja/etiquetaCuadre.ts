import { estadoCuadre } from '@/lib/cierre/cuadre'
import { formatPesos } from '@/lib/utils'

export function etiquetaCuadre(dineroContado: number, diferencia: number) {
  switch (estadoCuadre(dineroContado, diferencia)) {
    case 'pendiente':
      return { texto: 'Pendiente de conteo', clase: 'bg-bg-elevated text-text-secondary' }
    case 'ok':
      return { texto: 'Cuadre OK', clase: 'bg-accent-green-dim text-accent-green' }
    case 'falta':
      return {
        texto: `Falta ${formatPesos(Math.abs(diferencia))}`,
        clase: 'bg-accent-red-dim text-accent-red',
      }
    case 'sobra':
      return { texto: `Sobra ${formatPesos(diferencia)}`, clase: 'bg-amber-500/15 text-amber-400' }
  }
}

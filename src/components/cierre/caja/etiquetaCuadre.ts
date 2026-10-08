import { estadoCuadre } from '@/lib/cierre/cuadre'
import { formatPesos } from '@/lib/utils'

/** Texto y colores del resultado del cuadre (fondo claro y fondo café) */
export function etiquetaCuadre(dineroContado: number, diferencia: number) {
  switch (estadoCuadre(dineroContado, diferencia)) {
    case 'pendiente':
      return {
        texto: 'Falta contar el dinero',
        clase: 'bg-bg-elevated text-text-secondary',
        claseOscura: 'bg-cocoa-2 text-cocoa-muted',
      }
    case 'ok':
      return {
        texto: 'Cuadre perfecto',
        clase: 'bg-ok-soft text-ok',
        claseOscura: 'bg-[#1F4A33] text-[#9BE3BC]',
      }
    case 'falta':
      return {
        texto: `Falta ${formatPesos(Math.abs(diferencia))}`,
        clase: 'bg-bad-soft text-bad',
        claseOscura: 'bg-[#4A1D1F] text-[#FFB4B7]',
      }
    case 'sobra':
      return {
        texto: `Sobra ${formatPesos(diferencia)}`,
        clase: 'bg-warn-soft text-warn',
        claseOscura: 'bg-[#4A3712] text-[#FFD48A]',
      }
  }
}

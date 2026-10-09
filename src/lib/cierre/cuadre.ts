/** Cuadre de caja del día (mismo cálculo que la función guardar_cierre) */
export type CuadreInput = {
  dineroBaseInicio: number
  dineroFinal: number
  itemsVendidos: { cantidad: number; precio_unitario: number }[]
  transferencias: { monto: number }[]
  gastos: { monto: number }[]
  domicilios: { monto: number }[]
  /** Fiados, consumos y préstamos (opcional para cierres antiguos) */
  descuentos?: { monto: number }[]
}

export type Cuadre = {
  totalVentas: number
  totalTransferencias: number
  totalGastos: number
  totalDomicilios: number
  totalDescuentos: number
  efectivoEsperado: number
  diferencia: number
  cuadreOk: boolean
}

const suma = (lista: { monto: number }[]) => lista.reduce((s, x) => s + x.monto, 0)

export function calcularCuadre(input: CuadreInput): Cuadre {
  const totalVentas = input.itemsVendidos.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
  const totalTransferencias = suma(input.transferencias)
  const totalGastos = suma(input.gastos)
  const totalDomicilios = suma(input.domicilios)
  const totalDescuentos = suma(input.descuentos ?? [])
  const efectivoEsperado =
    input.dineroBaseInicio +
    totalVentas -
    totalTransferencias -
    totalGastos -
    totalDomicilios -
    totalDescuentos
  const diferencia = input.dineroFinal - efectivoEsperado

  return {
    totalVentas,
    totalTransferencias,
    totalGastos,
    totalDomicilios,
    totalDescuentos,
    efectivoEsperado,
    diferencia,
    cuadreOk: diferencia === 0,
  }
}

export type EstadoCuadre = 'pendiente' | 'ok' | 'falta' | 'sobra'

export function estadoCuadre(dineroContado: number, diferencia: number): EstadoCuadre {
  if (dineroContado <= 0) return 'pendiente'
  if (diferencia === 0) return 'ok'
  return diferencia < 0 ? 'falta' : 'sobra'
}

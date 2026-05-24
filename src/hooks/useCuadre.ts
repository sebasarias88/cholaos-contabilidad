'use client'

import { useMemo } from 'react'

export type CuadreInput = {
  dineroBaseInicio: number
  dineroFinal: number
  itemsVendidos: { cantidad: number; precio_unitario: number }[]
  transferencias: { monto: number }[]
  gastos: { monto: number }[]
  esAdmin: boolean
}

export function calcularCuadre({
  dineroBaseInicio,
  dineroFinal,
  itemsVendidos,
  transferencias,
  gastos,
}: Omit<CuadreInput, 'esAdmin'>) {
  const totalVentas = itemsVendidos.reduce(
    (s, i) => s + i.cantidad * i.precio_unitario,
    0
  )
  const totalTransferencias = transferencias.reduce((s, t) => s + t.monto, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)

  const efectivoEsperado =
    dineroBaseInicio + totalVentas - totalTransferencias - totalGastos
  const diferencia = dineroFinal - efectivoEsperado

  return {
    totalVentas,
    totalTransferencias,
    totalGastos,
    efectivoEsperado,
    diferencia,
    cuadreOk: diferencia === 0,
    dineroEsperadoEnCaja: efectivoEsperado,
  }
}

export function useCuadre(input: CuadreInput) {
  const {
    dineroBaseInicio,
    dineroFinal,
    itemsVendidos,
    transferencias,
    gastos,
  } = input

  return useMemo(
    () =>
      calcularCuadre({
        dineroBaseInicio,
        dineroFinal,
        itemsVendidos,
        transferencias,
        gastos,
      }),
    [
      dineroBaseInicio,
      dineroFinal,
      itemsVendidos,
      transferencias,
      gastos,
    ]
  )
}

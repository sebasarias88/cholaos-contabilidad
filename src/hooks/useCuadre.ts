'use client'

import { useMemo } from 'react'

export type CuadreInput = {
  dineroBaseInicio: number
  dineroFinal: number
  itemsVendidos: { cantidad: number; precio_unitario: number }[]
  transferencias: { monto: number }[]
  gastos: { monto: number }[]
  domicilios: { monto: number }[]
  esAdmin: boolean
}

export function calcularCuadre({
  dineroBaseInicio,
  dineroFinal,
  itemsVendidos,
  transferencias,
  gastos,
  domicilios,
}: Omit<CuadreInput, 'esAdmin'>) {
  const totalVentas = itemsVendidos.reduce(
    (s, i) => s + i.cantidad * i.precio_unitario,
    0
  )
  const totalTransferencias = transferencias.reduce((s, t) => s + t.monto, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const totalDomicilios = domicilios.reduce((s, d) => s + d.monto, 0)

  const efectivoEsperado =
    dineroBaseInicio +
    totalVentas -
    totalTransferencias -
    totalGastos -
    totalDomicilios
  const diferencia = dineroFinal - efectivoEsperado

  return {
    totalVentas,
    totalTransferencias,
    totalGastos,
    totalDomicilios,
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
    domicilios,
  } = input

  return useMemo(
    () =>
      calcularCuadre({
        dineroBaseInicio,
        dineroFinal,
        itemsVendidos,
        transferencias,
        gastos,
        domicilios,
      }),
    [
      dineroBaseInicio,
      dineroFinal,
      itemsVendidos,
      transferencias,
      gastos,
      domicilios,
    ]
  )
}

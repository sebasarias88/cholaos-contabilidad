export type Rol = 'admin' | 'empleado'

export interface Usuario {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
  created_at: string
  /** Solo en GET /api/usuarios (admin) */
  email?: string
}

/** Response POST /api/usuarios */
export interface CrearEmpleadoResponse {
  mensaje: string
  usuario: Usuario
}

/** GET/PUT /api/configuracion */
export interface ConfiguracionNegocio {
  nombre_negocio: string
  updated_at?: string
}

export interface ConfiguracionNegocioInput {
  nombre_negocio: string
}

// ============================================================
// PRODUCTO — generalizado
// ============================================================
/** masa = masas de pizza: solo se cuenta con cuántas empezó y terminó (sin precio) */
export type TipoProducto = 'vaso' | 'comida' | 'insumo' | 'masa'

export type TipoVaso = 'normal' | 'ancho' | 'angosto'

export interface TallaVaso {
  id: string
  onzas: number
  descripcion?: string
  tipo: TipoVaso
  activo: boolean
  created_at: string
}

// ============================================================
// VARIANTE DE PRODUCTO
// ============================================================
export interface VarianteProducto {
  id: string
  producto_id: string
  nombre: string // 'Mesa', 'Para Llevar', 'Paisa Mesa', 'Paisa Llevar'
  precio: number
  activo: boolean
  orden: number
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  tipo: TipoProducto
  onzas?: number // solo requerido para tipo 'vaso'
  unidad?: string // ej: 'porción', 'unidad', 'caja' para comida/insumo
  precio?: number // null/undefined para insumos
  activo: boolean
  orden: number
  talla_id?: string // solo para tipo 'vaso'
  tiene_variantes: boolean
  /** Comida que se cuenta como los vasos (inicio, llegaron, quedan): ej. gaseosas, agua */
  conteo_inventario?: boolean
  /** Comida sin variantes que va en la sección Adiciones del cierre */
  es_adicion?: boolean
  /** Insumo que se cuenta en cajas + unidades (ej. barquillos: 24 por caja) */
  unidades_por_caja?: number | null
  /** Masa de pizza que además lleva el número de masas */
  lleva_masas?: boolean
  talla?: TallaVaso
  variantes?: VarianteProducto[] // join opcional
  created_at: string
  updated_at: string
}

/** Body PUT /api/productos/[id] */
export interface ProductoUpdateInput {
  nombre?: string
  descripcion?: string | null
  tipo?: TipoProducto
  onzas?: number | null
  unidad?: string | null
  precio?: number | null
  talla_id?: string | null
  /** true = crear vaso físico nuevo en vez de reutilizar talla_id */
  crear_talla?: boolean
  tipo_vaso?: TipoVaso
  talla_descripcion?: string | null
  activo?: boolean
  tiene_variantes?: boolean
  /** Solo comida sin variantes: se cuenta como los vasos en el cierre */
  conteo_inventario?: boolean
  es_adicion?: boolean
  unidades_por_caja?: number | null
  lleva_masas?: boolean
}

/** Join en GET /api/ventas */
export interface UsuarioResumen {
  nombre: string
  rol: Rol
}

/** Join en detalle de venta */
export interface ProductoResumen {
  nombre: string
  tipo?: TipoProducto
  onzas?: number
  unidad?: string
}

export interface Venta {
  id: string
  fecha: string // 'YYYY-MM-DD'
  usuario_id: string
  total: number
  observaciones?: string
  created_at: string
  usuario?: UsuarioResumen
  detalle?: DetalleVenta[]
}

export type OrigenLineaVenta = 'vaso' | 'comida' | 'variante'

export interface DetalleVenta {
  id: string
  venta_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number // campo generado por Postgres
  /** vaso = detalle_ventas; comida/variante se arman desde el cierre del mismo día */
  origen?: OrigenLineaVenta
  producto?: ProductoResumen
}

// Para los reportes
export interface ResumenDia {
  fecha: string
  total_ventas: number
  total_vasos: number
  ingresos: number
}

// ============================================================
// TALLAS DE VASOS (definidas arriba junto a TipoProducto)
// ============================================================

// ============================================================
// CIERRE DEL DÍA
// ============================================================
export type EstadoCierre = 'borrador' | 'cerrado'

export interface CierreDia {
  id: string
  fecha: string // 'YYYY-MM-DD'
  usuario_id: string
  dinero_base_inicio: number
  dinero_final: number
  total_transferencias: number
  total_gastos: number
  total_domicilios: number
  /** Fiados, consumos o préstamos: se descuentan de lo que debe haber en caja */
  total_descuentos?: number
  total_ventas: number // SOLO visible para admin
  efectivo_esperado: number // campo generado por Postgres
  diferencia: number // campo generado por Postgres
  /** Base con la que cerró el día anterior (null en cierres antiguos) */
  base_anterior?: number | null
  /** Base nueva escrita ese día; dinero_base_inicio es la base usada en el cuadre */
  base_nueva?: number | null
  observaciones?: string
  estado: EstadoCierre
  created_at: string
  updated_at: string
  // joins opcionales
  usuario?: Usuario
  gastos?: GastoDia[]
  transferencias?: TransferenciaDia[]
  domicilios?: DomicilioDia[]
  descuentos?: DescuentoDia[]
  conteo_vasos?: ConteoVaso[]
  ventas_variantes?: VentaVarianteCierre[]
  ventas_comida?: VentaComidaCierre[]
  ventas?: Venta[]
}

// Lo que ve el empleado (sin datos sensibles)
export interface CierreDiaEmpleado {
  id: string
  fecha: string
  dinero_base_inicio: number
  dinero_final: number
  total_transferencias: number
  total_gastos: number
  total_domicilios: number
  /** Fiados, consumos o préstamos: se descuentan de lo que debe haber en caja */
  total_descuentos?: number
  observaciones?: string
  // NO incluye: total_ventas, efectivo_esperado, diferencia
  base_anterior?: number | null
  base_nueva?: number | null
  efectivo_final_esperado: number // calculado en API
  cuadre_ok: boolean
  diferencia_caja: number // cuánto falta o sobra
  estado: EstadoCierre
  gastos?: GastoDia[]
  transferencias?: TransferenciaDia[]
  domicilios?: DomicilioDia[]
  descuentos?: DescuentoDia[]
  conteo_vasos?: ConteoVaso[]
  ventas_variantes?: VentaVarianteCierre[]
  ventas_comida?: VentaComidaCierre[]
}

// ============================================================
// GASTOS DEL DÍA
// ============================================================
export interface GastoDia {
  id: string
  cierre_id: string
  descripcion: string
  monto: number
  created_at: string
}

export interface NuevoGasto {
  descripcion: string
  monto: number
}

// ============================================================
// TRANSFERENCIAS
// ============================================================
export interface MedioTransferencia {
  id: string
  nombre: string
  activo: boolean
  orden: number
  created_at: string
}

/** Body POST /api/medios-transferencia */
export interface CrearMedioTransferenciaPayload {
  nombre: string
}

/** Body PUT /api/medios-transferencia/[id] */
export interface ActualizarMedioTransferenciaPayload {
  nombre?: string
  activo?: boolean
}

export interface TransferenciaDia {
  id: string
  cierre_id: string
  descripcion: string
  monto: number
  medio_id?: string | null
  medio?: Pick<MedioTransferencia, 'nombre'>
  created_at: string
}

export interface DomicilioDia {
  id: string
  cierre_id: string
  descripcion?: string | null
  monto: number
  created_at: string
}

/** Fiado, consumo o préstamo que no se pagó: se descuenta del total del cierre */
export interface DescuentoDia {
  id: string
  cierre_id: string
  descripcion: string
  monto: number
  created_at: string
}

export interface NuevoDomicilio {
  descripcion?: string
  monto: number
}

// ============================================================
// VENTAS EN CIERRE (variantes y comida)
// ============================================================
export interface VentaVarianteCierre {
  id: string
  cierre_id: string
  variante_id: string
  cantidad: number
  /** Precio al momento del cierre (null en registros antiguos) */
  precio_unitario?: number | null
  variante?: VarianteProducto & {
    producto?: Pick<Producto, 'nombre' | 'unidad'>
  }
}

export interface VentaComidaCierre {
  id: string
  cierre_id: string
  producto_id: string
  cantidad: number
  /** Precio al momento del cierre (null en registros antiguos) */
  precio_unitario?: number | null
  producto?: Pick<Producto, 'nombre' | 'precio' | 'unidad'>
}

// ============================================================
// CONTEO DE VASOS
// ============================================================
export interface MotivoNovedad {
  id: string
  descripcion: string
  emoji: string
  activo: boolean
  orden: number
}

/** Body POST /api/motivos-novedad */
export interface CrearMotivoNovedadPayload {
  descripcion: string
  emoji: string
}

/** Body PUT /api/motivos-novedad/[id] */
export interface ActualizarMotivoNovedadPayload {
  descripcion?: string
  emoji?: string
  activo?: boolean
}

export interface NovedadVaso {
  id?: string
  conteo_id?: string
  motivo_id: string
  motivo_custom?: string // solo si motivo es "Otro"
  cantidad: number
  // join
  motivo?: MotivoNovedad
}

/** Input para crear/actualizar (sin id ni conteo_id) */
export interface NovedadVasoInput {
  motivo_id: string
  motivo_custom?: string
  cantidad: number
}

export interface ConteoVaso {
  id: string
  cierre_id: string
  talla_id?: string
  producto_id?: string
  cantidad_inicio: number
  cantidad_nuevos: number
  /** null en borradores (aún sin contar) */
  cantidad_final: number | null
  cantidad_gastada: number | null // generado: inicio + nuevos - final
  /** Reparto de vendidos por producto (vasos compartidos) */
  desglose?: DesgloseVasoProducto[] | null
  /** Masas de pizza: número de masas anotado ese día */
  numero_masas?: number | null
  observacion?: string
  // join
  talla?: TallaVaso
  producto?: Producto
  novedades?: NovedadVaso[]
}

/** Línea de desglose: cuántos vasos vendidos van a cada producto (precio) */
export type DesgloseVasoProducto = {
  producto_id: string
  cantidad: number
}

/** Estado editable en UI del cierre (comida/insumo) */
export type ConteoProductoValor = {
  cantidad_inicio: number
  cantidad_nuevos: number | null
  cantidad_final: number | null
}

/** Estado editable en UI del cierre (vasos) */
export type ConteoVasoValor = {
  cantidad_inicio: number
  cantidad_nuevos: number | null
  cantidad_final: number | null
  novedades: NovedadVasoInput[]
  /** Cantidades por producto que comparten esta talla (suma = vendidos) */
  desglose: DesgloseVasoProducto[]
}

// ============================================================
// VENTAS EN CIERRE (estado editable en UI)
// ============================================================
export interface VentaVarianteInput {
  variante_id: string
  cantidad: number
}

export interface VentaComidaInput {
  producto_id: string
  cantidad: number
}

// ============================================================
// PAYLOAD POST /api/cierres → función guardar_cierre
// Precios e inventario inicial los pone la BD, no el cliente.
// ============================================================
export interface ConteoVasoPayload {
  talla_id: string
  cantidad_nuevos: number
  /** null = no contado (la BD lo rechaza) */
  cantidad_final: number | null
  novedades: NovedadVasoInput[]
  desglose: DesgloseVasoProducto[]
}

export interface ConteoInsumoPayload {
  producto_id: string
  cantidad_nuevos: number
  cantidad_final: number | null
}

/** Bebidas contadas como los vasos: vendidos = inicio + llegaron − quedan − novedades */
export interface ConteoBebidaPayload {
  producto_id: string
  cantidad_nuevos: number
  cantidad_final: number | null
  novedades: NovedadVasoInput[]
}

/** Masas de pizza: el usuario escribe con cuántas empezó y con cuántas terminó */
export interface ConteoMasaPayload {
  producto_id: string
  cantidad_inicio: number | null
  cantidad_final: number | null
  /** Solo masas con lleva_masas */
  numero_masas: number | null
}

export interface GuardarCierrePayload {
  fecha: string // 'YYYY-MM-DD'
  /** false = guardar avance (borrador); true = cierre definitivo */
  finalizar: boolean
  /** Base con la que cerró el día anterior. Solo admin puede fijarla; si no, se toma del último cierre */
  dinero_base_inicio?: number
  /** Base nueva si el dueño sacó o metió plata (null = sigue la de anoche) */
  base_nueva: number | null
  dinero_final: number | null
  observaciones?: string
  gastos: NuevoGasto[]
  transferencias: { medio_id: string; monto: number }[]
  domicilios: NuevoDomicilio[]
  descuentos: { descripcion: string; monto: number }[]
  vasos: ConteoVasoPayload[]
  insumos: ConteoInsumoPayload[]
  masas: ConteoMasaPayload[]
  bebidas: ConteoBebidaPayload[]
  ventas_comida: VentaComidaInput[]
  ventas_variantes: VentaVarianteInput[]
}

/** POST /api/cierres (empleado no recibe total_ventas) */
export interface GuardarCierreResponse {
  ok: true
  cierre_id: string
  fecha: string
  estado: EstadoCierre
  total_ventas?: number
  total_gastos: number
  total_transferencias: number
  total_domicilios: number
  dinero_base_inicio: number
  dinero_final: number
  efectivo_esperado: number
  diferencia: number
}

// --- GET /api/cierres/prellenado?fecha= ---

export interface ConteoBase {
  talla_id: string | null
  producto_id: string | null
  cantidad_final: number
}

/** Todo lo que necesita el formulario del cierre en una sola petición */
export interface DatosCierre {
  fecha: string
  hoy: string
  /** Último cierre finalizado (un cierre nuevo debe ser posterior) */
  ultimo_cierre: string | null
  /** Cierre usado como base de inventario y caja */
  fecha_anterior: string | null
  dinero_base_inicio: number
  base_conteos: ConteoBase[]
  productos: Producto[]
  motivos: MotivoNovedad[]
  medios: MedioTransferencia[]
  /** Cierre guardado en esa fecha (borrador o cerrado) */
  cierre: CierreDia | CierreDiaEmpleado | null
}

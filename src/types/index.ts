export type Rol = "admin" | "empleado";

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

/** Body POST /api/usuarios */
export interface CrearEmpleadoInput {
  email: string;
  nombre: string;
  password: string;
}

/** Response POST /api/usuarios */
export interface CrearEmpleadoResponse {
  mensaje: string;
  usuario: Usuario;
}

/** Body PUT /api/usuarios/[id] */
export interface UsuarioUpdateInput {
  nombre?: string;
  activo?: boolean;
}

/** GET/PUT /api/configuracion */
export interface ConfiguracionNegocio {
  nombre_negocio: string;
  updated_at?: string;
}

export interface ConfiguracionNegocioInput {
  nombre_negocio: string;
}

// ============================================================
// PRODUCTO — generalizado
// ============================================================
export type TipoProducto = "vaso" | "comida" | "insumo";

// ============================================================
// VARIANTE DE PRODUCTO
// ============================================================
export interface VarianteProducto {
  id: string;
  producto_id: string;
  nombre: string; // 'Mesa', 'Para Llevar', 'Paisa Mesa', 'Paisa Llevar'
  precio: number;
  activo: boolean;
  orden: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto;
  onzas?: number; // solo requerido para tipo 'vaso'
  unidad?: string; // ej: 'porción', 'unidad', 'caja' para comida/insumo
  precio?: number; // null/undefined para insumos
  activo: boolean;
  orden: number;
  talla_id?: string; // solo para tipo 'vaso'
  tiene_variantes: boolean;
  talla?: TallaVaso;
  variantes?: VarianteProducto[]; // join opcional
  created_at: string;
  updated_at: string;
}

/** Body POST /api/productos */
export interface ProductoCreateInput {
  nombre: string;
  descripcion?: string | null;
  tipo: TipoProducto;
  onzas?: number | null;
  unidad?: string | null;
  precio?: number | null;
  talla_id?: string | null;
  tiene_variantes?: boolean;
}

/** Body PUT /api/productos/[id] */
export interface ProductoUpdateInput {
  nombre?: string;
  descripcion?: string | null;
  tipo?: TipoProducto;
  onzas?: number | null;
  unidad?: string | null;
  precio?: number | null;
  talla_id?: string | null;
  activo?: boolean;
  tiene_variantes?: boolean;
}

/** Join en GET /api/ventas */
export interface UsuarioResumen {
  nombre: string;
  rol: Rol;
}

/** Join en detalle de venta */
export interface ProductoResumen {
  nombre: string;
  tipo?: TipoProducto;
  onzas?: number;
  unidad?: string;
}

export interface Venta {
  id: string;
  fecha: string; // 'YYYY-MM-DD'
  usuario_id: string;
  total: number;
  observaciones?: string;
  created_at: string;
  usuario?: UsuarioResumen;
  detalle?: DetalleVenta[];
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number; // campo generado por Postgres
  producto?: ProductoResumen;
}

/** Body PUT /api/ventas/[id] — solo cabecera */
export interface VentaUpdateInput {
  observaciones?: string | null;
  total?: number;
}

/** Body POST /api/ventas */
export interface NuevaVentaPayload {
  observaciones?: string;
  items: {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

// Para los reportes
export interface ResumenDia {
  fecha: string;
  total_ventas: number;
  total_vasos: number;
  ingresos: number;
}

// ============================================================
// TALLAS DE VASOS
// ============================================================
export type TipoVaso = "normal" | "ancho" | "angosto";

export interface TallaVaso {
  id: string;
  onzas: number;
  descripcion?: string;
  tipo: TipoVaso;
  activo: boolean;
  created_at: string;
}

// ============================================================
// CIERRE DEL DÍA
// ============================================================
export type EstadoCierre = "borrador" | "cerrado";

export interface CierreDia {
  id: string;
  fecha: string; // 'YYYY-MM-DD'
  usuario_id: string;
  dinero_base_inicio: number;
  dinero_final: number;
  total_transferencias: number;
  total_gastos: number;
  total_domicilios: number;
  total_ventas: number; // SOLO visible para admin
  efectivo_esperado: number; // campo generado por Postgres
  diferencia: number; // campo generado por Postgres
  observaciones?: string;
  estado: EstadoCierre;
  created_at: string;
  updated_at: string;
  // joins opcionales
  usuario?: Usuario;
  gastos?: GastoDia[];
  transferencias?: TransferenciaDia[];
  domicilios?: DomicilioDia[];
  conteo_vasos?: ConteoVaso[];
  ventas_variantes?: VentaVarianteCierre[];
  ventas_comida?: VentaComidaCierre[];
  ventas?: Venta[];
}

// Lo que ve el empleado (sin datos sensibles)
export interface CierreDiaEmpleado {
  id: string;
  fecha: string;
  dinero_base_inicio: number;
  dinero_final: number;
  total_transferencias: number;
  total_gastos: number;
  total_domicilios: number;
  observaciones?: string;
  // NO incluye: total_ventas, efectivo_esperado, diferencia
  efectivo_final_esperado: number; // calculado en API sin revelar ventas
  cuadre_ok: boolean;
  diferencia_caja: number; // cuánto falta o sobra
  estado: EstadoCierre;
  gastos?: GastoDia[];
  transferencias?: TransferenciaDia[];
  domicilios?: DomicilioDia[];
  conteo_vasos?: ConteoVaso[];
  ventas_variantes?: VentaVarianteCierre[];
  ventas_comida?: VentaComidaCierre[];
}

// ============================================================
// GASTOS DEL DÍA
// ============================================================
export interface GastoDia {
  id: string;
  cierre_id: string;
  descripcion: string;
  monto: number;
  created_at: string;
}

export interface NuevoGasto {
  descripcion: string;
  monto: number;
}

// ============================================================
// TRANSFERENCIAS
// ============================================================
export interface MedioTransferencia {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

/** Body POST /api/medios-transferencia */
export interface CrearMedioTransferenciaPayload {
  nombre: string;
}

/** Body PUT /api/medios-transferencia/[id] */
export interface ActualizarMedioTransferenciaPayload {
  nombre?: string;
  activo?: boolean;
}

export interface TransferenciaDia {
  id: string;
  cierre_id: string;
  descripcion: string;
  monto: number;
  medio_id?: string | null;
  medio?: Pick<MedioTransferencia, 'nombre'>;
  created_at: string;
}

export interface NuevaTransferencia {
  medio_id: string;
  descripcion?: string;
  monto: number;
}

export interface DomicilioDia {
  id: string;
  cierre_id: string;
  descripcion?: string | null;
  monto: number;
  created_at: string;
}

export interface NuevoDomicilio {
  descripcion?: string;
  monto: number;
}

// ============================================================
// VENTAS EN CIERRE (variantes y comida)
// ============================================================
export interface VentaVarianteCierre {
  id: string;
  cierre_id: string;
  variante_id: string;
  cantidad: number;
  variante?: VarianteProducto & {
    producto?: Pick<Producto, 'nombre'>;
  };
}

export interface VentaComidaCierre {
  id: string;
  cierre_id: string;
  producto_id: string;
  cantidad: number;
  producto?: Pick<Producto, 'nombre' | 'precio'>;
}

// ============================================================
// CONTEO DE VASOS
// ============================================================
export interface MotivoNovedad {
  id: string;
  descripcion: string;
  emoji: string;
  activo: boolean;
  orden: number;
}

/** Body POST /api/motivos-novedad */
export interface CrearMotivoNovedadPayload {
  descripcion: string;
  emoji: string;
}

/** Body PUT /api/motivos-novedad/[id] */
export interface ActualizarMotivoNovedadPayload {
  descripcion?: string;
  emoji?: string;
  activo?: boolean;
}

export interface NovedadVaso {
  id?: string;
  conteo_id?: string;
  motivo_id: string;
  motivo_custom?: string; // solo si motivo es "Otro"
  cantidad: number;
  // join
  motivo?: MotivoNovedad;
}

/** Input para crear/actualizar (sin id ni conteo_id) */
export interface NovedadVasoInput {
  motivo_id: string;
  motivo_custom?: string;
  cantidad: number;
}

export interface ConteoVaso {
  id: string;
  cierre_id: string;
  talla_id?: string;
  producto_id?: string;
  cantidad_inicio: number;
  cantidad_nuevos: number;
  cantidad_final: number;
  cantidad_gastada: number; // generado: inicio + nuevos - final
  cantidad_novedades: number; // suma de novedades (calculado en query)
  cantidad_vendida: number; // gastada - novedades (calculado)
  observacion?: string;
  // join
  talla?: TallaVaso;
  producto?: Producto;
  novedades?: NovedadVaso[];
}

export interface ConteoVasoInput {
  talla_id: string;
  cantidad_inicio: number;
  cantidad_nuevos: number;
  cantidad_final: number;
  observacion?: string;
  novedades: NovedadVasoInput[]; // default []
}

// ============================================================
// CONTEO — generalizado para todos los tipos
// ============================================================
export interface ConteoProductoInput {
  // Para vasos
  talla_id?: string;
  // Para comida e insumos
  producto_id?: string;
  // Común a todos
  tipo: TipoProducto;
  cantidad_inicio: number;
  cantidad_nuevos: number;
  cantidad_final: number;
  observacion?: string;
  novedades?: NovedadVasoInput[]; // solo para vasos
  /** Precio unitario para calcular ventas (vaso/comida); no aplica a insumos */
  precio_unitario?: number;
}

export interface ConteoProducto {
  id: string;
  cierre_id: string;
  talla_id?: string;
  producto_id?: string;
  tipo: TipoProducto;
  cantidad_inicio: number;
  cantidad_nuevos: number;
  cantidad_final: number;
  cantidad_gastada: number; // generado: inicio + nuevos - final
  cantidad_novedades: number; // solo vasos
  cantidad_vendida: number; // gastada - novedades
  observacion?: string;
  talla?: TallaVaso; // join para vasos
  producto?: Producto; // join para comida/insumos
  novedades?: NovedadVaso[]; // solo vasos
}

// ============================================================
// PAYLOAD PARA GUARDAR CIERRE COMPLETO
// ============================================================
export interface ItemVendidoInput {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

// ============================================================
// VENTA DE VARIANTE (en el cierre)
// ============================================================
export interface VentaVarianteInput {
  variante_id: string;
  cantidad: number;
  /** Para calcular total al guardar el cierre */
  precio_unitario?: number;
}

// ============================================================
// VENTA DE COMIDA SIMPLE (en el cierre)
// ============================================================
export interface VentaComidaInput {
  producto_id: string;
  cantidad: number;
  /** Para calcular total al guardar el cierre */
  precio_unitario?: number;
}

export interface GuardarCierrePayload {
  fecha: string; // 'YYYY-MM-DD'
  dinero_base_inicio: number;
  dinero_final: number;
  observaciones?: string;
  gastos: NuevoGasto[];
  transferencias: NuevaTransferencia[];
  domicilios: NuevoDomicilio[];
  /** Vasos e insumos (conteo de inventario) */
  conteo_productos: ConteoProductoInput[];
  /** Pizzas / productos con variantes */
  ventas_variantes: VentaVarianteInput[];
  /** Gaseosas, adiciones y comida sin variantes */
  ventas_comida: VentaComidaInput[];
}

/** POST /api/cierres */
export interface GuardarCierreResponse {
  ok: true;
  cierre_id: string;
  estado: 'cerrado';
  total_ventas?: number;
  total_gastos?: number;
  total_transferencias?: number;
  total_domicilios?: number;
}

// --- GET /api/cierres/prellenado ---

/** @deprecated Preferir ConteoProductoPrellenado unificado */
export interface ConteoVasoPrellenado {
  talla_id: string;
  talla: TallaVaso;
  cantidad_inicio: number;
  cantidad_nuevos: number | null;
  cantidad_final: number | null;
  novedades: NovedadVasoInput[];
}

/** Fila unificada de prellenado (vaso / comida / insumo) */
export interface ConteoProductoPrellenado {
  producto_id: string;
  talla_id?: string | null;
  tipo: TipoProducto;
  producto: Producto;
  cantidad_inicio: number;
  cantidad_nuevos: number;
  cantidad_final: number;
  observacion?: string;
  novedades: NovedadVasoInput[];
  precio_unitario: number;
}

export interface PrellenadoNuevo {
  tipo: "nuevo";
  dinero_base_inicio: number;
  conteo_productos: ConteoProductoPrellenado[];
}

export interface PrellenadoCierreExistente {
  tipo: "cierre_existente";
  cierre: CierreDia;
}

/** Empleado: cierre del día sin total_ventas */
export interface PrellenadoCierreExistenteEmpleado {
  tipo: "cierre_existente";
  cierre: CierreDiaEmpleado;
}

export type PrellenadoCierreResponse =
  | PrellenadoNuevo
  | PrellenadoCierreExistente;

export type PrellenadoCierreResponseEmpleado =
  | PrellenadoNuevo
  | PrellenadoCierreExistenteEmpleado;

// --- GET /api/cierres ---

/** Admin: ?fecha= → un cierre; ?desde=&hasta= → lista */
export type GetCierreAdminResponse = CierreDia | CierreDia[];

/** Empleado: ?fecha= → un cierre sanitizado */
export type GetCierreEmpleadoResponse = CierreDiaEmpleado;

// --- POST /api/tallas-vasos ---

export interface CrearTallaVasoPayload {
  onzas: number;
  descripcion?: string;
  tipo: TipoVaso;
}

export interface ActualizarTallaVasoPayload {
  onzas?: number;
  descripcion?: string;
  tipo?: TipoVaso;
  activo?: boolean;
}

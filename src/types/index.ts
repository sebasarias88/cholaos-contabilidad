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

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  onzas: number;
  precio: number;
  activo: boolean;
  talla_id?: string;
  talla?: TallaVaso;
  created_at: string;
  updated_at: string;
}

/** Body POST /api/productos */
export interface ProductoCreateInput {
  nombre: string;
  descripcion?: string;
  onzas: number;
  precio: number;
}

/** Body PUT /api/productos/[id] */
export interface ProductoUpdateInput {
  nombre?: string;
  descripcion?: string;
  onzas?: number;
  precio?: number;
  activo?: boolean;
}

/** Join en GET /api/ventas */
export interface UsuarioResumen {
  nombre: string;
  rol: Rol;
}

/** Join en detalle de venta */
export interface ProductoResumen {
  nombre: string;
  onzas: number;
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
  conteo_vasos?: ConteoVaso[];
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
  observaciones?: string;
  // NO incluye: total_ventas, efectivo_esperado, diferencia
  efectivo_final_esperado: number; // calculado en API sin revelar ventas
  cuadre_ok: boolean;
  diferencia_caja: number; // cuánto falta o sobra
  estado: EstadoCierre;
  gastos?: GastoDia[];
  transferencias?: TransferenciaDia[];
  conteo_vasos?: ConteoVaso[];
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
export interface TransferenciaDia {
  id: string;
  cierre_id: string;
  descripcion: string;
  monto: number;
  created_at: string;
}

export interface NuevaTransferencia {
  descripcion: string;
  monto: number;
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
  talla_id: string;
  cantidad_inicio: number;
  cantidad_nuevos: number;
  cantidad_final: number;
  cantidad_gastada: number; // generado: inicio + nuevos - final
  cantidad_novedades: number; // suma de novedades (calculado en query)
  cantidad_vendida: number; // gastada - novedades (calculado)
  observacion?: string;
  // join
  talla?: TallaVaso;
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
// PAYLOAD PARA GUARDAR CIERRE COMPLETO
// ============================================================
export interface ItemVendidoInput {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface GuardarCierrePayload {
  fecha: string; // 'YYYY-MM-DD'
  dinero_base_inicio: number;
  dinero_final: number;
  observaciones?: string;
  gastos: NuevoGasto[];
  transferencias: NuevaTransferencia[];
  conteo_vasos: ConteoVasoInput[];
  items_vendidos: ItemVendidoInput[];
}

/** POST /api/cierres */
export interface GuardarCierreResponse {
  ok: true;
  cierre_id: string;
  estado: 'cerrado';
  total_ventas?: number;
  total_gastos?: number;
  total_transferencias?: number;
}

// --- GET /api/cierres/prellenado ---

/** Fila de conteo en pre-llenado tipo "nuevo" */
export interface ConteoVasoPrellenado {
  talla_id: string;
  talla: TallaVaso;
  cantidad_inicio: number;
  cantidad_nuevos: number | null;
  cantidad_final: number | null;
  /** Siempre vacío al inicio del día (novedades no se heredan de ayer) */
  novedades: NovedadVasoInput[];
}

export interface PrellenadoNuevo {
  tipo: "nuevo";
  dinero_base_inicio: number;
  conteo_vasos: ConteoVasoPrellenado[];
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

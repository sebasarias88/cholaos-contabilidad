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

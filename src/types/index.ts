export type Rol = "dueno" | "empleado";

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
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

export interface Venta {
  id: string;
  fecha: string; // 'YYYY-MM-DD'
  usuario_id: string;
  total: number;
  observaciones?: string;
  created_at: string;
  // joins opcionales
  usuario?: Usuario;
  detalle?: DetalleVenta[];
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number; // campo generado por Postgres
  // joins
  producto?: Producto;
}

// Para crear una venta desde el formulario
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

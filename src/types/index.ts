import { Database } from './database'

export type Material = Database['public']['Tables']['materiales']['Row']
export type MaterialInsert = Database['public']['Tables']['materiales']['Insert']
export type MaterialUpdate = Database['public']['Tables']['materiales']['Update']

export type Producto = Database['public']['Tables']['productos']['Row']
export type ProductoInsert = Database['public']['Tables']['productos']['Insert']
export type ProductoUpdate = Database['public']['Tables']['productos']['Update']

export type ProductoMaterial = Database['public']['Tables']['producto_materiales']['Row']
export type ProductoMaterialInsert = Database['public']['Tables']['producto_materiales']['Insert']

export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export type Venta = Database['public']['Tables']['ventas']['Row']
export type VentaInsert = Database['public']['Tables']['ventas']['Insert']
export type VentaUpdate = Database['public']['Tables']['ventas']['Update']

export type Gasto = Database['public']['Tables']['gastos']['Row']
export type GastoInsert = Database['public']['Tables']['gastos']['Insert']
export type GastoUpdate = Database['public']['Tables']['gastos']['Update']

export type MovimientoInventario = Database['public']['Tables']['movimientos_inventario']['Row']

export type OrdenPendiente = Database['public']['Tables']['ordenes_pendientes']['Row']
export type OrdenPendienteInsert = Database['public']['Tables']['ordenes_pendientes']['Insert']
export type OrdenPendienteUpdate = Database['public']['Tables']['ordenes_pendientes']['Update']

export type Nota = Database['public']['Tables']['notas']['Row']
export type NotaInsert = Database['public']['Tables']['notas']['Insert']
export type NotaUpdate = Database['public']['Tables']['notas']['Update']

export type HistorialCompra = Database['public']['Tables']['historial_compras_materiales']['Row']
export type HistorialCompraInsert = Database['public']['Tables']['historial_compras_materiales']['Insert']

// Tipos extendidos con relaciones
export interface ProductoConMateriales extends Producto {
  materiales?: (ProductoMaterial & {
    material: Material
  })[]
  costo_produccion?: number
  ganancia?: number
  margen_porcentaje?: number
}

export interface VentaConRelaciones extends Venta {
  producto?: Producto
  cliente?: Cliente
}

export interface OrdenConRelaciones extends OrdenPendiente {
  producto?: Producto
  cliente?: Cliente
}

// Tipos para vistas
export type CostoProduccion = Database['public']['Views']['v_costo_produccion_productos']['Row']
export type ResumenVentas = Database['public']['Views']['v_resumen_ventas']['Row']
export type ProductoMasVendido = Database['public']['Views']['v_productos_mas_vendidos']['Row']
export type MaterialStockBajo = Database['public']['Views']['v_materiales_stock_bajo']['Row']

// Tipos para estadísticas del dashboard
export interface DashboardStats {
  totalInvertido: number
  totalVentas: number
  gananciaNeta: number
  margenGanancia: number
  ventasHoy: number
  ventasMes: number
  productosActivos: number
  materialesStockBajo: number
}

// Tipos para filtros
export interface FiltroFecha {
  desde?: string
  hasta?: string
}

export interface FiltroVentas extends FiltroFecha {
  estado?: string
  producto_id?: string
  cliente_id?: string
}

export interface FiltroProductos {
  categoria?: string
  activo?: boolean
}

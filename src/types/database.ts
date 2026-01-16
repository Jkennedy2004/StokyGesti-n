export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      materiales: {
        Row: {
          id: string
          nombre: string
          precio_unitario: number
          unidad_medida: string
          stock_disponible: number
          proveedor: string | null
          fecha_compra: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          precio_unitario: number
          unidad_medida: string
          stock_disponible?: number
          proveedor?: string | null
          fecha_compra?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          precio_unitario?: number
          unidad_medida?: string
          stock_disponible?: number
          proveedor?: string | null
          fecha_compra?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      productos: {
        Row: {
          id: string
          nombre: string
          categoria: string
          descripcion: string | null
          precio_venta: number
          tiempo_elaboracion: number | null
          foto_url: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          categoria: string
          descripcion?: string | null
          precio_venta: number
          tiempo_elaboracion?: number | null
          foto_url?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          categoria?: string
          descripcion?: string | null
          precio_venta?: number
          tiempo_elaboracion?: number | null
          foto_url?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      producto_materiales: {
        Row: {
          id: string
          producto_id: string
          material_id: string
          cantidad: number
          created_at: string
        }
        Insert: {
          id?: string
          producto_id: string
          material_id: string
          cantidad: number
          created_at?: string
        }
        Update: {
          id?: string
          producto_id?: string
          material_id?: string
          cantidad?: number
          created_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          telefono: string | null
          email: string | null
          direccion: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ventas: {
        Row: {
          id: string
          producto_id: string | null
          cliente_id: string | null
          cantidad: number
          precio_unitario: number
          precio_total: number
          costo_produccion: number | null
          ganancia: number | null
          fecha_venta: string
          metodo_pago: string | null
          estado: string
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          producto_id?: string | null
          cliente_id?: string | null
          cantidad: number
          precio_unitario: number
          precio_total: number
          costo_produccion?: number | null
          ganancia?: number | null
          fecha_venta: string
          metodo_pago?: string | null
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          producto_id?: string | null
          cliente_id?: string | null
          cantidad?: number
          precio_unitario?: number
          precio_total?: number
          costo_produccion?: number | null
          ganancia?: number | null
          fecha_venta?: string
          metodo_pago?: string | null
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gastos: {
        Row: {
          id: string
          concepto: string
          categoria: string
          monto: number
          fecha: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          concepto: string
          categoria: string
          monto: number
          fecha: string
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          concepto?: string
          categoria?: string
          monto?: number
          fecha?: string
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      movimientos_inventario: {
        Row: {
          id: string
          material_id: string
          tipo: string
          cantidad: number
          stock_anterior: number | null
          stock_nuevo: number | null
          motivo: string | null
          referencia_id: string | null
          fecha: string
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          tipo: string
          cantidad: number
          stock_anterior?: number | null
          stock_nuevo?: number | null
          motivo?: string | null
          referencia_id?: string | null
          fecha?: string
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          tipo?: string
          cantidad?: number
          stock_anterior?: number | null
          stock_nuevo?: number | null
          motivo?: string | null
          referencia_id?: string | null
          fecha?: string
          created?: string
        }
      }
      ordenes_pendientes: {
        Row: {
          id: string
          producto_id: string | null
          cliente_id: string | null
          cantidad: number
          fecha_pedido: string
          fecha_entrega_estimada: string | null
          estado: string
          precio_acordado: number | null
          anticipo: number
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          producto_id?: string | null
          cliente_id?: string | null
          cantidad: number
          fecha_pedido: string
          fecha_entrega_estimada?: string | null
          estado?: string
          precio_acordado?: number | null
          anticipo?: number
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          producto_id?: string | null
          cliente_id?: string | null
          cantidad?: number
          fecha_pedido?: string
          fecha_entrega_estimada?: string | null
          estado?: string
          precio_acordado?: number | null
          anticipo?: number
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notas: {
        Row: {
          id: string
          titulo: string
          contenido: string | null
          prioridad: string
          fecha_recordatorio: string | null
          completado: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          contenido?: string | null
          prioridad?: string
          fecha_recordatorio?: string | null
          completado?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          contenido?: string | null
          prioridad?: string
          fecha_recordatorio?: string | null
          completado?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      historial_compras_materiales: {
        Row: {
          id: string
          material_id: string
          cantidad: number
          precio_unitario: number
          total: number
          proveedor: string | null
          fecha_compra: string
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          cantidad: number
          precio_unitario: number
          total: number
          proveedor?: string | null
          fecha_compra: string
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          cantidad?: number
          precio_unitario?: number
          total?: number
          proveedor?: string | null
          fecha_compra?: string
          notas?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      v_costo_produccion_productos: {
        Row: {
          producto_id: string
          producto_nombre: string
          categoria: string
          precio_venta: number
          costo_produccion: number
          ganancia: number
          margen_porcentaje: number
        }
      }
      v_resumen_ventas: {
        Row: {
          fecha: string
          total_ventas: number
          unidades_vendidas: number
          ingresos_totales: number
          costos_totales: number
          ganancia_total: number
        }
      }
      v_productos_mas_vendidos: {
        Row: {
          id: string
          nombre: string
          categoria: string
          numero_ventas: number
          unidades_vendidas: number
          ingresos_totales: number
          ganancia_total: number
        }
      }
      v_materiales_stock_bajo: {
        Row: {
          id: string
          nombre: string
          stock_disponible: number
          unidad_medida: string
          proveedor: string | null
        }
      }
    }
    Functions: {
      actualizar_stock_material: {
        Args: {
          p_material_id: string
          p_cantidad: number
          p_tipo: string
          p_motivo?: string
          p_referencia_id?: string
        }
        Returns: void
      }
    }
  }
}

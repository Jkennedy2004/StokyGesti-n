import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'

export function useNotificationMonitor() {
  const { hasPermission, notify } = useNotifications()

  useEffect(() => {
    if (!hasPermission) return

    // Verificar órdenes próximas a vencer cada 30 minutos
    const checkOrdenes = async () => {
      try {
        const { data: ordenes } = await supabase
          .from('ordenes_pendientes')
          .select(`
            *,
            productos (nombre),
            clientes (nombre)
          `)
          .in('estado', ['pendiente', 'en_proceso'])

        if (!ordenes) return

        const hoy = new Date()
        ordenes.forEach((orden) => {
          if (!orden.fecha_entrega_estimada) return

          const fechaEntrega = new Date(orden.fecha_entrega_estimada)
          const diferenciaDias = Math.ceil(
            (fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Orden vencida
          if (diferenciaDias < 0) {
            notify.ordenVencida(
              orden.clientes?.nombre || 'Cliente',
              orden.productos?.nombre || 'Producto'
            )
          }
          // Orden vence en 1-2 días
          else if (diferenciaDias <= 2 && diferenciaDias >= 0) {
            notify.ordenProximaVencer(
              orden.clientes?.nombre || 'Cliente',
              orden.productos?.nombre || 'Producto',
              diferenciaDias
            )
          }
        })
      } catch (error) {
        console.error('Error al verificar órdenes:', error)
      }
    }

    // Verificar stock bajo cada hora
    const checkStock = async () => {
      try {
        const { data: materiales } = await supabase
          .from('materiales')
          .select('*')
          .lt('stock_disponible', 10)

        if (!materiales) return

        materiales.forEach((material) => {
          if (material.stock_disponible === 0) {
            notify.stockAgotado(material.nombre)
          } else if (material.stock_disponible < 5) {
            notify.stockBajo(material.nombre, material.stock_disponible)
          }
        })
      } catch (error) {
        console.error('Error al verificar stock:', error)
      }
    }

    // Verificar recordatorios de notas cada 15 minutos
    const checkRecordatorios = async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0]
        const { data: notas } = await supabase
          .from('notas')
          .select('*')
          .eq('completado', false)
          .eq('fecha_recordatorio', hoy)

        if (!notas) return

        notas.forEach((nota) => {
          notify.recordatorioNota(nota.titulo)
        })
      } catch (error) {
        console.error('Error al verificar recordatorios:', error)
      }
    }

    // Ejecutar verificaciones iniciales
    checkOrdenes()
    checkStock()
    checkRecordatorios()

    // Configurar intervalos
    const ordenesInterval = setInterval(checkOrdenes, 30 * 60 * 1000) // 30 min
    const stockInterval = setInterval(checkStock, 60 * 60 * 1000) // 1 hora
    const recordatoriosInterval = setInterval(checkRecordatorios, 15 * 60 * 1000) // 15 min

    return () => {
      clearInterval(ordenesInterval)
      clearInterval(stockInterval)
      clearInterval(recordatoriosInterval)
    }
  }, [hasPermission, notify])
}

// Sistema de notificaciones push para el navegador

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  data?: any
}

class NotificationService {
  private permission: NotificationPermission = 'default'

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission
    }
  }

  // Solicitar permiso para mostrar notificaciones
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    return permission === 'granted'
  }

  // Verificar si hay permiso
  hasPermission(): boolean {
    return this.permission === 'granted'
  }

  // Mostrar notificación
  async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.hasPermission()) {
      const granted = await this.requestPermission()
      if (!granted) {
        console.warn('Permiso de notificaciones denegado')
        return null
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.svg',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      })

      // Auto cerrar después de 5 segundos si no requiere interacción
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000)
      }

      return notification
    } catch (error) {
      console.error('Error al mostrar notificación:', error)
      return null
    }
  }

  // Notificaciones específicas del sistema

  ordenProximaVencer(clienteNombre: string, productoNombre: string, dias: number) {
    return this.show({
      title: '⏰ Orden próxima a vencer',
      body: `La orden de ${productoNombre} para ${clienteNombre} vence en ${dias} ${dias === 1 ? 'día' : 'días'}`,
      tag: 'orden-vencer',
      requireInteraction: true,
    })
  }

  ordenVencida(clienteNombre: string, productoNombre: string) {
    return this.show({
      title: '🚨 Orden vencida',
      body: `La orden de ${productoNombre} para ${clienteNombre} ya venció`,
      tag: 'orden-vencida',
      requireInteraction: true,
    })
  }

  stockBajo(materialNombre: string, cantidad: number) {
    return this.show({
      title: '📦 Stock bajo',
      body: `${materialNombre} tiene solo ${cantidad} unidades disponibles`,
      tag: 'stock-bajo',
    })
  }

  stockAgotado(materialNombre: string) {
    return this.show({
      title: '❌ Material agotado',
      body: `${materialNombre} se ha agotado completamente`,
      tag: 'stock-agotado',
      requireInteraction: true,
    })
  }

  recordatorioNota(titulo: string) {
    return this.show({
      title: '📝 Recordatorio',
      body: titulo,
      tag: 'recordatorio',
      requireInteraction: true,
    })
  }

  nuevaVenta(productoNombre: string, monto: number) {
    return this.show({
      title: '💰 Nueva venta',
      body: `${productoNombre} - $${monto.toFixed(2)}`,
      tag: 'nueva-venta',
    })
  }

  pagoRecibido(clienteNombre: string, monto: number) {
    return this.show({
      title: '✅ Pago recibido',
      body: `${clienteNombre} pagó $${monto.toFixed(2)}`,
      tag: 'pago-recibido',
    })
  }

  metaDiaria(metaAlcanzada: number, metaTotal: number) {
    const porcentaje = Math.round((metaAlcanzada / metaTotal) * 100)
    return this.show({
      title: '🎯 Progreso de ventas',
      body: `Has alcanzado el ${porcentaje}% de tu meta diaria ($${metaAlcanzada.toFixed(2)} / $${metaTotal.toFixed(2)})`,
      tag: 'meta-diaria',
    })
  }
}

export const notificationService = new NotificationService()

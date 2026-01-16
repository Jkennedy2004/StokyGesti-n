import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell, BellOff, Check, X } from 'lucide-react'

export function NotificationSettings() {
  const { isSupported, hasPermission, requestPermission, notify } = useNotifications()
  const [isRequesting, setIsRequesting] = useState(false)

  const handleEnableNotifications = async () => {
    setIsRequesting(true)
    const granted = await requestPermission()
    setIsRequesting(false)

    if (granted) {
      // Mostrar notificación de prueba
      notify.show({
        title: '¡Notificaciones activadas! 🎉',
        body: 'Recibirás alertas sobre eventos importantes en tu negocio',
      })
    }
  }

  const testNotifications = () => {
    notify.show({
      title: '🔔 Notificación de prueba',
      body: 'Las notificaciones funcionan correctamente',
    })
  }

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold">Notificaciones no disponibles</h3>
        </div>
        <p className="text-gray-600">
          Tu navegador no soporta notificaciones push. Actualiza a la última versión o usa otro navegador.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Notificaciones Push</h3>
        </div>
        {hasPermission ? (
          <Badge variant="success">
            <Check className="w-3 h-3 mr-1" />
            Activadas
          </Badge>
        ) : (
          <Badge variant="secondary">
            <X className="w-3 h-3 mr-1" />
            Desactivadas
          </Badge>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Recibe alertas en tiempo real sobre eventos importantes en tu negocio
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-600" />
          <span>Órdenes próximas a vencer</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-600" />
          <span>Stock bajo de materiales</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-600" />
          <span>Recordatorios de notas</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-600" />
          <span>Nuevas ventas y pagos</span>
        </div>
      </div>

      <div className="flex gap-3">
        {!hasPermission ? (
          <Button
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className="flex-1"
          >
            <Bell className="w-4 h-4 mr-2" />
            {isRequesting ? 'Solicitando permiso...' : 'Activar Notificaciones'}
          </Button>
        ) : (
          <Button
            onClick={testNotifications}
            variant="outline"
            className="flex-1"
          >
            <Bell className="w-4 h-4 mr-2" />
            Probar Notificación
          </Button>
        )}
      </div>
    </Card>
  )
}

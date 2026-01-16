import { useState, useEffect } from 'react'
import { notificationService } from '@/lib/notifications'

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ('Notification' in window) {
      setIsSupported(true)
      setHasPermission(Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    setHasPermission(granted)
    return granted
  }

  return {
    isSupported,
    hasPermission,
    requestPermission,
    notify: notificationService,
  }
}

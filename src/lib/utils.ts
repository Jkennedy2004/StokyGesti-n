import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function calcularPorcentaje(valor: number, total: number): number {
  if (total === 0) return 0
  return (valor / total) * 100
}

export function calcularMargenGanancia(precioVenta: number, costoProduccion: number): number {
  if (precioVenta === 0) return 0
  return ((precioVenta - costoProduccion) / precioVenta) * 100
}

export function calcularROI(gananciaNeta: number, inversionTotal: number): number {
  if (inversionTotal === 0) return 0
  return (gananciaNeta / inversionTotal) * 100
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function getFirstDayOfMonth(): string {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

export function getLastDayOfMonth(): string {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
}

export function getFirstDayOfYear(): string {
  const date = new Date()
  return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0]
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

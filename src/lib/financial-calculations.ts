// Cálculos financieros y análisis de costos

export interface CostosOperativos {
  gastosEnvio: number
  gastosPublicidad: number
  gastosServicios: number
  gastosHerramientas: number
  gastosOtros: number
  totalGastosFijos: number
  totalGastosVariables: number
  totalGastos: number
}

export interface AnalisisFinanciero {
  totalIngresos: number
  costoMateriales: number
  gastosOperativos: number
  costoTotal: number
  utilidadBruta: number
  utilidadNeta: number
  margenBruto: number
  margenNeto: number
  roi: number
  puntoEquilibrio: number
}

export interface RentabilidadProducto {
  producto_id: string
  nombre: string
  categoria: string
  ventasUnidades: number
  ventasTotales: number
  costoProduccion: number
  margenContribucion: number
  utilidad: number
  margenPorcentaje: number
}

/**
 * Calcula los costos operativos totales del negocio
 */
export function calcularCostosOperativos(gastos: any[]): CostosOperativos {
  const gastosEnvio = gastos
    .filter(g => g.categoria === 'envio')
    .reduce((sum, g) => sum + g.monto, 0)
  
  const gastosPublicidad = gastos
    .filter(g => g.categoria === 'publicidad')
    .reduce((sum, g) => sum + g.monto, 0)
  
  const gastosServicios = gastos
    .filter(g => g.categoria === 'servicios')
    .reduce((sum, g) => sum + g.monto, 0)
  
  const gastosHerramientas = gastos
    .filter(g => g.categoria === 'herramientas')
    .reduce((sum, g) => sum + g.monto, 0)
  
  const gastosOtros = gastos
    .filter(g => g.categoria === 'otros')
    .reduce((sum, g) => sum + g.monto, 0)

  // Gastos fijos: servicios (luz, agua, internet, etc.)
  const totalGastosFijos = gastosServicios

  // Gastos variables: envío, publicidad, herramientas, otros
  const totalGastosVariables = gastosEnvio + gastosPublicidad + gastosHerramientas + gastosOtros

  const totalGastos = totalGastosFijos + totalGastosVariables

  return {
    gastosEnvio,
    gastosPublicidad,
    gastosServicios,
    gastosHerramientas,
    gastosOtros,
    totalGastosFijos,
    totalGastosVariables,
    totalGastos,
  }
}

/**
 * Calcula el análisis financiero completo
 */
export function calcularAnalisisFinanciero(
  ventas: any[],
  gastos: any[],
  materiales: any[]
): AnalisisFinanciero {
  // Ingresos totales
  const totalIngresos = ventas.reduce((sum, v) => sum + v.precio_total, 0)

  // Costo de materiales (inventario actual)
  const costoMateriales = materiales.reduce(
    (sum, m) => sum + m.precio_unitario * m.stock_disponible,
    0
  )

  // Gastos operativos
  const costosOp = calcularCostosOperativos(gastos)
  const gastosOperativos = costosOp.totalGastos

  // Costo total = materiales + gastos
  const costoTotal = costoMateriales + gastosOperativos

  // Utilidad bruta = ingresos - costo de producción
  const costoProduccionVentas = ventas.reduce(
    (sum, v) => sum + (v.costo_produccion || 0) * v.cantidad,
    0
  )
  const utilidadBruta = totalIngresos - costoProduccionVentas

  // Utilidad neta = ingresos - (costo producción + gastos)
  const utilidadNeta = totalIngresos - costoProduccionVentas - gastosOperativos

  // Márgenes
  const margenBruto = totalIngresos > 0 ? (utilidadBruta / totalIngresos) * 100 : 0
  const margenNeto = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0

  // ROI = (utilidad neta / inversión) * 100
  const inversion = costoMateriales + gastosOperativos
  const roi = inversion > 0 ? (utilidadNeta / inversion) * 100 : 0

  // Punto de equilibrio = gastos fijos / (precio promedio - costo variable promedio)
  const precioPromedio = ventas.length > 0 ? totalIngresos / ventas.length : 0
  const costoVariablePromedio = ventas.length > 0 
    ? (costoProduccionVentas + costosOp.totalGastosVariables) / ventas.length 
    : 0
  
  const margenContribucionUnitario = precioPromedio - costoVariablePromedio
  const puntoEquilibrio = margenContribucionUnitario > 0
    ? costosOp.totalGastosFijos / margenContribucionUnitario
    : 0

  return {
    totalIngresos,
    costoMateriales,
    gastosOperativos,
    costoTotal,
    utilidadBruta,
    utilidadNeta,
    margenBruto,
    margenNeto,
    roi,
    puntoEquilibrio,
  }
}

/**
 * Calcula la rentabilidad por producto
 */
export function calcularRentabilidadProductos(
  ventas: any[],
  productos: any[]
): RentabilidadProducto[] {
  const rentabilidadMap = new Map<string, RentabilidadProducto>()

  ventas.forEach(venta => {
    const productoId = venta.producto_id
    if (!productoId) return

    const producto = productos.find(p => p.id === productoId)
    if (!producto) return

    const existing = rentabilidadMap.get(productoId)
    
    const ventasUnidades = (existing?.ventasUnidades || 0) + venta.cantidad
    const ventasTotales = (existing?.ventasTotales || 0) + venta.precio_total
    const costoProduccion = (existing?.costoProduccion || 0) + 
      (venta.costo_produccion || 0) * venta.cantidad
    const utilidad = ventasTotales - costoProduccion
    const margenContribucion = venta.precio_total - (venta.costo_produccion || 0) * venta.cantidad
    const margenPorcentaje = ventasTotales > 0 ? (utilidad / ventasTotales) * 100 : 0

    rentabilidadMap.set(productoId, {
      producto_id: productoId,
      nombre: producto.nombre,
      categoria: producto.categoria,
      ventasUnidades,
      ventasTotales,
      costoProduccion,
      margenContribucion: (existing?.margenContribucion || 0) + margenContribucion,
      utilidad,
      margenPorcentaje,
    })
  })

  return Array.from(rentabilidadMap.values())
    .sort((a, b) => b.utilidad - a.utilidad)
}

/**
 * Calcula el costo promedio de adquisición de cliente (CAC)
 */
export function calcularCAC(gastosMarketing: number, clientesNuevos: number): number {
  return clientesNuevos > 0 ? gastosMarketing / clientesNuevos : 0
}

/**
 * Calcula el valor de vida del cliente (LTV)
 */
export function calcularLTV(
  promedioCompra: number,
  frecuenciaCompra: number,
  vidaCliente: number
): number {
  return promedioCompra * frecuenciaCompra * vidaCliente
}

/**
 * Determina la salud financiera del negocio
 */
export function evaluarSaludFinanciera(analisis: AnalisisFinanciero): {
  nivel: 'excelente' | 'bueno' | 'regular' | 'malo' | 'critico'
  mensaje: string
  recomendaciones: string[]
} {
  const { margenNeto, roi } = analisis
  const recomendaciones: string[] = []

  // Evaluar margen neto
  let nivel: 'excelente' | 'bueno' | 'regular' | 'malo' | 'critico'
  let mensaje: string

  if (margenNeto >= 30) {
    nivel = 'excelente'
    mensaje = '¡Excelente! Tu negocio es muy rentable'
  } else if (margenNeto >= 20) {
    nivel = 'bueno'
    mensaje = 'Buen desempeño financiero'
    recomendaciones.push('Busca oportunidades para aumentar el margen')
  } else if (margenNeto >= 10) {
    nivel = 'regular'
    mensaje = 'Margen aceptable, pero hay espacio para mejorar'
    recomendaciones.push('Revisa tus gastos operativos')
    recomendaciones.push('Considera aumentar precios o reducir costos')
  } else if (margenNeto >= 0) {
    nivel = 'malo'
    mensaje = 'Margen bajo, necesitas tomar acción'
    recomendaciones.push('Urgente: reduce gastos innecesarios')
    recomendaciones.push('Analiza qué productos son menos rentables')
    recomendaciones.push('Renegocia con proveedores')
  } else {
    nivel = 'critico'
    mensaje = '¡Alerta! Estás operando con pérdidas'
    recomendaciones.push('CRÍTICO: Revisa inmediatamente tu estructura de costos')
    recomendaciones.push('Considera suspender productos no rentables')
    recomendaciones.push('Busca asesoría financiera')
  }

  // Evaluar ROI
  if (roi < 0) {
    recomendaciones.push('ROI negativo: estás perdiendo dinero en tu inversión')
  } else if (roi < 20) {
    recomendaciones.push('ROI bajo: busca formas de mejorar el retorno de inversión')
  }

  return { nivel, mensaje, recomendaciones }
}

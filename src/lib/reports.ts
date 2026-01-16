import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Tipos de reportes
export type TipoReporte = 'ventas' | 'inventario' | 'gastos' | 'ordenes' | 'financiero' | 'clientes'

// Formato de exportación
export type FormatoExportacion = 'pdf' | 'excel'

// Función auxiliar para formatear fechas
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función auxiliar para formatear moneda
const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`
}

// Generar reporte de Ventas
export const generarReporteVentas = async (
  ventas: any[],
  fechaInicio: string,
  fechaFin: string,
  formato: FormatoExportacion = 'pdf'
) => {
  const totalVentas = ventas.reduce((sum, v) => sum + v.precio_total, 0)
  const promedioVenta = ventas.length > 0 ? totalVentas / ventas.length : 0

  if (formato === 'pdf') {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Reporte de Ventas', 14, 22)
    
    // Período
    doc.setFontSize(12)
    doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 14, 32)
    
    // Resumen
    doc.setFontSize(10)
    doc.text(`Total de ventas: ${ventas.length}`, 14, 42)
    doc.text(`Monto total: ${formatCurrency(totalVentas)}`, 14, 48)
    doc.text(`Promedio por venta: ${formatCurrency(promedioVenta)}`, 14, 54)
    
    // Tabla de ventas
    const tableData = ventas.map(venta => [
      formatDate(venta.fecha_venta),
      venta.clientes?.nombre || 'N/A',
      venta.productos?.nombre || 'N/A',
      venta.cantidad.toString(),
      formatCurrency(venta.precio_unitario),
      formatCurrency(venta.precio_total),
      venta.estado
    ])
    
    autoTable(doc, {
      startY: 65,
      head: [['Fecha', 'Cliente', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Guardar
    doc.save(`reporte-ventas-${new Date().getTime()}.pdf`)
  } else {
    // Generar CSV
    const csvData = [
      ['Fecha', 'Cliente', 'Producto', 'Cantidad', 'Precio Unitario', 'Total', 'Estado'],
      ...ventas.map(v => [
        formatDate(v.fecha_venta),
        v.clientes?.nombre || 'N/A',
        v.productos?.nombre || 'N/A',
        v.cantidad,
        v.precio_unitario,
        v.precio_total,
        v.estado
      ])
    ]
    
    downloadCSV(csvData, `reporte-ventas-${new Date().getTime()}.csv`)
  }
}

// Generar reporte de Inventario
export const generarReporteInventario = async (
  materiales: any[],
  formato: FormatoExportacion = 'pdf'
) => {
  const valorTotal = materiales.reduce((sum, m) => sum + (m.stock_disponible * m.precio_unitario), 0)
  const materialesBajoStock = materiales.filter(m => m.stock_disponible < 10).length

  if (formato === 'pdf') {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Reporte de Inventario', 14, 22)
    
    doc.setFontSize(12)
    doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, 14, 32)
    
    doc.setFontSize(10)
    doc.text(`Total de materiales: ${materiales.length}`, 14, 42)
    doc.text(`Valor total de inventario: ${formatCurrency(valorTotal)}`, 14, 48)
    doc.text(`Materiales con stock bajo: ${materialesBajoStock}`, 14, 54)
    
    const tableData = materiales.map(material => [
      material.nombre,
      Math.floor(material.stock_disponible).toString(),
      material.unidad_medida,
      formatCurrency(material.precio_unitario),
      formatCurrency(material.stock_disponible * material.precio_unitario),
      material.proveedor || '-',
      material.stock_disponible < 10 ? 'Bajo' : 'Normal'
    ])
    
    autoTable(doc, {
      startY: 65,
      head: [['Material', 'Stock', 'Unidad', 'Precio Unit.', 'Valor Total', 'Proveedor', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`reporte-inventario-${new Date().getTime()}.pdf`)
  } else {
    const csvData = [
      ['Material', 'Stock', 'Unidad', 'Precio Unitario', 'Valor Total', 'Proveedor', 'Estado'],
      ...materiales.map(m => [
        m.nombre,
        Math.floor(m.stock_disponible),
        m.unidad_medida,
        m.precio_unitario,
        m.stock_disponible * m.precio_unitario,
        m.proveedor || '-',
        m.stock_disponible < 10 ? 'Bajo' : 'Normal'
      ])
    ]
    
    downloadCSV(csvData, `reporte-inventario-${new Date().getTime()}.csv`)
  }
}

// Generar reporte de Gastos
export const generarReporteGastos = async (
  gastos: any[],
  fechaInicio: string,
  fechaFin: string,
  formato: FormatoExportacion = 'pdf'
) => {
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0)
  const promedioGasto = gastos.length > 0 ? totalGastos / gastos.length : 0
  
  // Agrupar por categoría
  const porCategoria = gastos.reduce((acc, g) => {
    const cat = g.categoria || 'Sin categoría'
    acc[cat] = (acc[cat] || 0) + g.monto
    return acc
  }, {} as Record<string, number>)

  if (formato === 'pdf') {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Reporte de Gastos', 14, 22)
    
    doc.setFontSize(12)
    doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 14, 32)
    
    doc.setFontSize(10)
    doc.text(`Total de gastos: ${gastos.length}`, 14, 42)
    doc.text(`Monto total: ${formatCurrency(totalGastos)}`, 14, 48)
    doc.text(`Promedio por gasto: ${formatCurrency(promedioGasto)}`, 14, 54)
    
    // Resumen por categoría
    let y: number = 65
    doc.setFontSize(12)
    doc.text('Por Categoría:', 14, y)
    y += 8
    doc.setFontSize(9)
    Object.entries(porCategoria).forEach(([cat, monto]) => {
      doc.text(`${cat}: ${formatCurrency(monto as number)}`, 20, y)
      y += 6
    })
    
    // Tabla de gastos
    const tableData = gastos.map(gasto => [
      formatDate(gasto.fecha),
      gasto.descripcion,
      gasto.categoria || 'Sin categoría',
      formatCurrency(gasto.monto),
      gasto.tipo_gasto || '-',
      gasto.proveedor || '-'
    ])
    
    autoTable(doc, {
      startY: y + 10,
      head: [['Fecha', 'Descripción', 'Categoría', 'Monto', 'Tipo', 'Proveedor']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`reporte-gastos-${new Date().getTime()}.pdf`)
  } else {
    const csvData = [
      ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Tipo', 'Proveedor'],
      ...gastos.map(g => [
        formatDate(g.fecha),
        g.descripcion,
        g.categoria || 'Sin categoría',
        g.monto,
        g.tipo_gasto || '-',
        g.proveedor || '-'
      ])
    ]
    
    downloadCSV(csvData, `reporte-gastos-${new Date().getTime()}.csv`)
  }
}

// Generar reporte de Órdenes
export const generarReporteOrdenes = async (
  ordenes: any[],
  formato: FormatoExportacion = 'pdf'
) => {
  const porEstado = ordenes.reduce((acc, o) => {
    acc[o.estado] = (acc[o.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const totalMonto = ordenes.reduce((sum, o) => sum + (o.precio_acordado || 0), 0)

  if (formato === 'pdf') {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Reporte de Órdenes', 14, 22)
    
    doc.setFontSize(12)
    doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, 14, 32)
    
    doc.setFontSize(10)
    doc.text(`Total de órdenes: ${ordenes.length}`, 14, 42)
    doc.text(`Monto total: ${formatCurrency(totalMonto)}`, 14, 48)
    
    let y = 60
    doc.setFontSize(12)
    doc.text('Por Estado:', 14, y)
    y += 8
    doc.setFontSize(9)
    Object.entries(porEstado).forEach(([estado, cantidad]) => {
      doc.text(`${estado}: ${cantidad}`, 20, y)
      y += 6
    })
    
    const tableData = ordenes.map(orden => [
      orden.id.substring(0, 8),
      orden.clientes?.nombre || 'N/A',
      formatDate(orden.fecha_pedido),
      orden.fecha_entrega_estimada ? formatDate(orden.fecha_entrega_estimada) : 'N/A',
      formatCurrency(orden.precio_acordado || 0),
      orden.estado
    ])
    
    autoTable(doc, {
      startY: y + 10,
      head: [['N° Orden', 'Cliente', 'Fecha Pedido', 'Fecha Entrega', 'Monto', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`reporte-ordenes-${new Date().getTime()}.pdf`)
  } else {
    const csvData = [
      ['N° Orden', 'Cliente', 'Fecha Pedido', 'Fecha Entrega', 'Monto', 'Estado'],
      ...ordenes.map(o => [
        o.id.substring(0, 8),
        o.clientes?.nombre || 'N/A',
        formatDate(o.fecha_pedido),
        o.fecha_entrega_estimada ? formatDate(o.fecha_entrega_estimada) : 'N/A',
        o.precio_acordado || 0,
        o.estado
      ])
    ]
    
    downloadCSV(csvData, `reporte-ordenes-${new Date().getTime()}.csv`)
  }
}

// Generar reporte de Clientes
export const generarReporteClientes = async (
  clientes: any[],
  ventas: any[],
  formato: FormatoExportacion = 'pdf'
) => {
  // Calcular estadísticas por cliente
  const clientesConStats = clientes.map(cliente => {
    const ventasCliente = ventas.filter(v => v.cliente_id === cliente.id)
    const totalCompras = ventasCliente.reduce((sum, v) => sum + v.total, 0)
    const cantidadCompras = ventasCliente.length
    
    return {
      ...cliente,
      totalCompras,
      cantidadCompras,
      promedioCompra: cantidadCompras > 0 ? totalCompras / cantidadCompras : 0
    }
  }).sort((a, b) => b.totalCompras - a.totalCompras)

  if (formato === 'pdf') {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Reporte de Clientes', 14, 22)
    
    doc.setFontSize(12)
    doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, 14, 32)
    
    doc.setFontSize(10)
    doc.text(`Total de clientes: ${clientes.length}`, 14, 42)
    
    const tableData = clientesConStats.map(cliente => [
      cliente.nombre,
      cliente.telefono || '-',
      cliente.email || '-',
      cliente.cantidadCompras.toString(),
      formatCurrency(cliente.totalCompras),
      formatCurrency(cliente.promedioCompra)
    ])
    
    autoTable(doc, {
      startY: 55,
      head: [['Cliente', 'Teléfono', 'Email', 'Compras', 'Total Gastado', 'Promedio']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`reporte-clientes-${new Date().getTime()}.pdf`)
  } else {
    const csvData = [
      ['Cliente', 'Teléfono', 'Email', 'Compras', 'Total Gastado', 'Promedio'],
      ...clientesConStats.map(c => [
        c.nombre,
        c.telefono || '-',
        c.email || '-',
        c.cantidadCompras,
        c.totalCompras,
        c.promedioCompra
      ])
    ]
    
    downloadCSV(csvData, `reporte-clientes-${new Date().getTime()}.csv`)
  }
}

// Función auxiliar para escapar valores CSV
const escaparCSV = (valor: any): string => {
  if (valor === null || valor === undefined) return ''
  const str = String(valor)
  // Si contiene comas, comillas o saltos de línea, envolver en comillas
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Función auxiliar para descargar CSV
const downloadCSV = (data: any[][], filename: string) => {
  // Convertir array a CSV con punto y coma como separador (mejor para Excel en español)
  const csv = data.map(row => 
    row.map(cell => escaparCSV(cell)).join(';')
  ).join('\n')
  
  // Agregar BOM UTF-8 para que Excel reconozca los acentos
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

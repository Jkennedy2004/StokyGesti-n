import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Plus, Pencil, Trash2, Clock, CheckCircle, Package, AlertCircle, DollarSign, ClipboardList, Search, Calendar } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'

interface Orden {
  id: string
  producto_id: string
  cliente_id: string
  cantidad: number
  fecha_pedido: string
  fecha_entrega_estimada: string
  estado: string
  precio_acordado: number
  anticipo: number
  notas: string
  created_at: string
  productos?: {
    nombre: string
    categoria: string
  }
  clientes?: {
    nombre: string
    telefono: string
  }
}

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', icon: Clock, color: 'warning' },
  { value: 'en_proceso', label: 'En Proceso', icon: Package, color: 'primary' },
  { value: 'completado', label: 'Completado', icon: CheckCircle, color: 'success' },
  { value: 'entregado', label: 'Entregado', icon: CheckCircle, color: 'success' }
]

export function Ordenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingOrden, setEditingOrden] = useState<Orden | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    producto_id: '',
    cliente_id: '',
    cantidad: 1,
    fecha_pedido: new Date().toISOString().split('T')[0],
    fecha_entrega_estimada: '',
    estado: 'pendiente',
    precio_acordado: 0,
    anticipo: 0,
    notas: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: ordenesData, error: errorOrdenes } = await supabase
        .from('ordenes_pendientes')
        .select(`
          *,
          productos (nombre, categoria),
          clientes (nombre, telefono)
        `)
        .order('fecha_pedido', { ascending: false })

      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      const { data: clientesData, error: errorClientes } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (errorOrdenes || errorProductos || errorClientes) {
        throw errorOrdenes || errorProductos || errorClientes
      }

      setOrdenes(ordenesData || [])
      setProductos(productosData || [])
      setClientes(clientesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar los datos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingOrden) {
        const { error } = await supabase
          .from('ordenes_pendientes')
          .update(formData)
          .eq('id', editingOrden.id)

        if (error) throw error
        alert('Orden actualizada exitosamente')
      } else {
        const { error } = await supabase
          .from('ordenes_pendientes')
          .insert([formData])

        if (error) throw error
        alert('Orden registrada exitosamente')
      }

      setIsModalOpen(false)
      resetForm()
      cargarDatos()
    } catch (error) {
      console.error('Error al guardar orden:', error)
      alert('Error al guardar la orden')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (orden: Orden) => {
    setEditingOrden(orden)
    setFormData({
      producto_id: orden.producto_id || '',
      cliente_id: orden.cliente_id || '',
      cantidad: orden.cantidad,
      fecha_pedido: orden.fecha_pedido,
      fecha_entrega_estimada: orden.fecha_entrega_estimada || '',
      estado: orden.estado,
      precio_acordado: orden.precio_acordado || 0,
      anticipo: orden.anticipo || 0,
      notas: orden.notas || ''
    })
    setIsModalOpen(true)
  }

  const openDeleteDialog = (id: string) => {
    setDeleteDialog({ isOpen: true, id })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, id: '' })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('ordenes_pendientes')
        .delete()
        .eq('id', deleteDialog.id)

      if (error) throw error
      alert('Orden eliminada exitosamente')
      closeDeleteDialog()
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar orden:', error)
      alert('Error al eliminar la orden')
    } finally {
      setIsDeleting(false)
    }
  }

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      // Si se marca como entregado, primero obtener los datos completos de la orden
      if (nuevoEstado === 'entregado') {
        const orden = ordenes.find(o => o.id === id)
        if (!orden) {
          alert('Orden no encontrada')
          return
        }

        // Verificar que tenga producto
        if (!orden.producto_id) {
          alert('Esta orden no tiene un producto asociado')
          return
        }

        // Calcular costo de producción
        const { data: costoData } = await supabase
          .from('v_costo_produccion_productos')
          .select('costo_produccion')
          .eq('producto_id', orden.producto_id)
          .single()

        const costoProduccion = costoData?.costo_produccion || 0
        const precioUnitario = (orden.precio_acordado || 0) / orden.cantidad
        const gananciaUnitaria = precioUnitario - costoProduccion

        // Registrar la venta
        const { data: ventaCreada, error: errorVenta } = await supabase
          .from('ventas')
          .insert([{
            producto_id: orden.producto_id,
            cliente_id: orden.cliente_id || null,
            cantidad: orden.cantidad,
            precio_unitario: precioUnitario,
            precio_total: orden.precio_acordado || 0,
            costo_produccion: costoProduccion,
            ganancia: gananciaUnitaria,
            fecha_venta: new Date().toISOString().split('T')[0],
            metodo_pago: 'efectivo',
            estado: 'entregado',
            notas: `Venta generada desde orden #${id.substring(0, 8)}. ${orden.notas || ''}`
          }])
          .select()
          .single()

        if (errorVenta) throw errorVenta

        // Descontar materiales del stock
        await descontarMaterialesDeStock(orden.producto_id, orden.cantidad, ventaCreada.id)
      }

      // Actualizar el estado de la orden
      const { error } = await supabase
        .from('ordenes_pendientes')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      
      if (nuevoEstado === 'entregado') {
        alert('Orden entregada exitosamente y venta registrada con descuento de materiales')
      } else {
        alert('Estado actualizado exitosamente')
      }
      
      cargarDatos()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('Error al actualizar el estado: ' + (error as any).message)
    }
  }

  async function descontarMaterialesDeStock(productoId: string, cantidadVendida: number, ventaId: string) {
    try {
      // Obtener los materiales del producto
      const { data: materialesProducto, error } = await supabase
        .from('producto_materiales')
        .select(`
          material_id,
          cantidad,
          materiales (nombre)
        `)
        .eq('producto_id', productoId)

      if (error) throw error

      if (!materialesProducto || materialesProducto.length === 0) {
        console.warn('Este producto no tiene materiales asociados')
        return
      }

      // Descontar cada material del stock
      for (const item of materialesProducto) {
        const cantidadADescontar = item.cantidad * cantidadVendida
        
        try {
          const { error: errorStock } = await supabase.rpc('actualizar_stock_material', {
            p_material_id: item.material_id,
            p_cantidad: cantidadADescontar,
            p_tipo: 'salida',
            p_motivo: `Orden entregada - Venta de producto (${cantidadVendida} unidades)`,
            p_referencia_id: ventaId
          })

          if (errorStock) {
            console.error(`Error al descontar material ${item.material_id}:`, errorStock)
          }
        } catch (err) {
          console.error(`Error al procesar material:`, err)
        }
      }
    } catch (error) {
      console.error('Error al descontar materiales del stock:', error)
      // No lanzamos el error para no bloquear la venta
    }
  }

  const registrarPagoCompleto = async (orden: Orden) => {
    const saldo = (orden.precio_acordado || 0) - (orden.anticipo || 0)
    
    if (saldo <= 0) {
      alert('Esta orden ya está completamente pagada')
      return
    }

    if (!confirm(`¿Registrar pago del saldo restante de $${saldo.toFixed(2)}?`)) return

    try {
      const { error } = await supabase
        .from('ordenes_pendientes')
        .update({ anticipo: orden.precio_acordado })
        .eq('id', orden.id)

      if (error) throw error
      alert('Pago registrado exitosamente')
      cargarDatos()
    } catch (error) {
      console.error('Error al registrar pago:', error)
      alert('Error al registrar el pago')
    }
  }

  const resetForm = () => {
    setFormData({
      producto_id: '',
      cliente_id: '',
      cantidad: 1,
      fecha_pedido: new Date().toISOString().split('T')[0],
      fecha_entrega_estimada: '',
      estado: 'pendiente',
      precio_acordado: 0,
      anticipo: 0,
      notas: ''
    })
    setEditingOrden(null)
  }

  // Función para ordenar (deshabilitada - usar ordenamiento de Supabase)
  /* const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // Icono de ordenamiento
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  } */

  // Filtros rápidos de fecha
  const aplicarFiltroRapido = (dias: number) => {
    const hasta = new Date()
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    setFechaDesde(desde.toISOString().split('T')[0])
    setFechaHasta(hasta.toISOString().split('T')[0])
    setCurrentPage(1)
  }

  const limpiarFiltrosFecha = () => {
    setFechaDesde('')
    setFechaHasta('')
    setCurrentPage(1)
  }

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter(orden => {
    const matchesEstado = filtroEstado === 'todos' || orden.estado === filtroEstado
    const matchesSearch = orden.productos?.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      orden.clientes?.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      orden.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesFechaDesde = !fechaDesde || orden.fecha_pedido >= fechaDesde
    const matchesFechaHasta = !fechaHasta || orden.fecha_pedido <= fechaHasta
    
    return matchesEstado && matchesSearch && matchesFechaDesde && matchesFechaHasta
  })

  // Ordenar órdenes por fecha_pedido descendente (más recientes primero)
  const ordenesOrdenadas = [...ordenesFiltradas].sort((a, b) => {
    const aValue = a.fecha_pedido
    const bValue = b.fecha_pedido
    if (aValue < bValue) return 1
    if (aValue > bValue) return -1
    return 0
  })

  // Paginación
  const totalOrdenesFiltradas = ordenesOrdenadas.length
  const totalPages = Math.ceil(totalOrdenesFiltradas / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const ordenesPaginadas = ordenesOrdenadas.slice(startIndex, endIndex)

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filtroEstado, fechaDesde, fechaHasta])

  const estadisticas = {
    total: ordenes.length,
    pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    enProceso: ordenes.filter(o => o.estado === 'en_proceso').length,
    completadas: ordenes.filter(o => o.estado === 'completado' || o.estado === 'entregado').length,
    totalValor: ordenes.reduce((sum, o) => sum + (o.precio_acordado || 0), 0),
    totalAnticipos: ordenes.reduce((sum, o) => sum + (o.anticipo || 0), 0),
    pendienteCobro: ordenes.reduce((sum, o) => sum + ((o.precio_acordado || 0) - (o.anticipo || 0)), 0)
  }

  const getEstadoBadge = (estado: string) => {
    const estadoConfig = ESTADOS.find(e => e.value === estado)
    if (!estadoConfig) return null
    
    const Icon = estadoConfig.icon
    return (
      <Badge variant={estadoConfig.color as any}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {estadoConfig.label}
      </Badge>
    )
  }

  const esFechaVencida = (fecha: string) => {
    if (!fecha) return false
    return new Date(fecha) < new Date()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Órdenes Pendientes</h1>
        <Button onClick={() => {
          resetForm()
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold">{estadisticas.total}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{estadisticas.pendientes}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas.enProceso}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.completadas}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-600 mb-1">Valor Total Órdenes</p>
          <p className="text-2xl font-bold text-green-600">
            ${estadisticas.totalValor.toFixed(2)}
          </p>
        </div>

        <div className="card p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Total Anticipos</p>
          <p className="text-2xl font-bold text-blue-600">
            ${estadisticas.totalAnticipos.toFixed(2)}
          </p>
        </div>

        <div className="card p-4 bg-orange-50 border-orange-200">
          <p className="text-sm text-gray-600 mb-1">Pendiente por Cobrar</p>
          <p className="text-2xl font-bold text-orange-600">
            ${estadisticas.pendienteCobro.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col gap-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por producto, cliente o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtroEstado === 'todos' ? 'primary' : 'outline'}
              onClick={() => {
                setFiltroEstado('todos')
                setCurrentPage(1)
              }}
              size="sm"
            >
              Todas ({ordenes.length})
            </Button>
            {ESTADOS.map(estado => (
              <Button
                key={estado.value}
                variant={filtroEstado === estado.value ? 'primary' : 'outline'}
                onClick={() => {
                  setFiltroEstado(estado.value)
                  setCurrentPage(1)
                }}
                size="sm"
              >
                {estado.label} ({ordenes.filter(o => o.estado === estado.value).length})
              </Button>
            ))}
          </div>

          {/* Filtros rápidos de fecha */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Filtrar por fecha de pedido:
            </span>
            <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido(7)}>
              Últimos 7 días
            </Button>
            <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido(30)}>
              Últimos 30 días
            </Button>
            <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido(90)}>
              Últimos 90 días
            </Button>
            {(fechaDesde || fechaHasta) && (
              <Button size="sm" variant="ghost" onClick={limpiarFiltrosFecha}>
                Limpiar
              </Button>
            )}
          </div>

          {/* Filtros personalizados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <Input
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Controles de ordenamiento y paginación */}
      {ordenesFiltradas.length > 0 && (
        <div className="card p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-sm text-gray-600">
            {totalOrdenesFiltradas} de {ordenes.length} órdenes
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Por página:</span>
            <Select
              options={[
                { value: '10', label: '10' },
                { value: '20', label: '20' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              value={itemsPerPage.toString()}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
      )}

      {/* Lista de órdenes */}
      <div className="grid grid-cols-1 gap-4">
        {ordenesFiltradas.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ClipboardList}
              title={filtroEstado !== 'todos' ? 'No se encontraron órdenes' : 'No hay órdenes aún'}
              description={
                filtroEstado !== 'todos'
                  ? 'Intenta ajustar el filtro de estado'
                  : 'Crea tu primera orden de trabajo para gestionar pedidos'
              }
              actionLabel={filtroEstado === 'todos' ? 'Crear Orden' : undefined}
              onAction={filtroEstado === 'todos' ? () => setIsModalOpen(true) : undefined}
            />
          </div>
        ) : (
          ordenesPaginadas.map((orden) => {
            const saldo = (orden.precio_acordado || 0) - (orden.anticipo || 0)
            const fechaVencida = esFechaVencida(orden.fecha_entrega_estimada)
            
            return (
              <div key={orden.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Columna izquierda - Info principal */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {orden.productos?.nombre || 'Producto eliminado'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {orden.clientes?.nombre || 'Cliente no especificado'}
                        </p>
                        {orden.clientes?.telefono && (
                          <p className="text-sm text-gray-500">{orden.clientes.telefono}</p>
                        )}
                      </div>
                      {getEstadoBadge(orden.estado)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Cantidad</p>
                        <p className="font-semibold">{orden.cantidad} unidades</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Fecha Pedido</p>
                        <p className="font-semibold">
                          {new Date(orden.fecha_pedido).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Fecha Entrega</p>
                        <p className={`font-semibold ${fechaVencida && orden.estado !== 'entregado' ? 'text-red-600' : ''}`}>
                          {orden.fecha_entrega_estimada 
                            ? new Date(orden.fecha_entrega_estimada).toLocaleDateString('es-ES')
                            : 'No especificada'}
                          {fechaVencida && orden.estado !== 'entregado' && (
                            <AlertCircle className="w-4 h-4 inline ml-1 text-red-500" />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Precio Acordado</p>
                        <p className="font-bold text-green-600">
                          ${(orden.precio_acordado || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso de pago */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">
                          Anticipo: ${(orden.anticipo || 0).toFixed(2)}
                        </span>
                        <span className="text-gray-600">
                          Saldo: ${saldo.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${orden.precio_acordado > 0 ? ((orden.anticipo || 0) / orden.precio_acordado) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {orden.notas && (
                      <p className="text-sm text-gray-600 italic">
                        Nota: {orden.notas}
                      </p>
                    )}
                  </div>

                  {/* Columna derecha - Acciones */}
                  <div className="flex lg:flex-col gap-2 lg:w-32">
                    {/* Botón de pago si hay saldo pendiente */}
                    {saldo > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => registrarPagoCompleto(orden)}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Pagar ${saldo.toFixed(0)}
                      </Button>
                    )}
                    {orden.estado === 'pendiente' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => cambiarEstado(orden.id, 'en_proceso')}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {orden.estado === 'en_proceso' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => cambiarEstado(orden.id, 'completado')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completar
                      </Button>
                    )}
                    {orden.estado === 'completado' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => cambiarEstado(orden.id, 'entregado')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Entregar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(orden)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDeleteDialog(orden.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Paginación */}
      {ordenesFiltradas.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalOrdenesFiltradas}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingOrden ? 'Editar Orden' : 'Nueva Orden'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Producto *
              </label>
              <Select
                value={formData.producto_id}
                onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                required
              >
                <option value="">Seleccionar producto...</option>
                {productos.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} ({producto.categoria})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cliente
              </label>
              <Select
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cantidad *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha Pedido *
              </label>
              <Input
                type="date"
                value={formData.fecha_pedido}
                onChange={(e) => setFormData({ ...formData, fecha_pedido: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha Entrega
              </label>
              <Input
                type="date"
                value={formData.fecha_entrega_estimada}
                onChange={(e) => setFormData({ ...formData, fecha_entrega_estimada: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Estado *
            </label>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              required
            >
              {ESTADOS.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Precio Acordado ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_acordado}
                onChange={(e) => setFormData({ ...formData, precio_acordado: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Anticipo ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={formData.precio_acordado}
                value={formData.anticipo}
                onChange={(e) => setFormData({ ...formData, anticipo: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {formData.precio_acordado > 0 && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                Saldo pendiente: <span className="font-bold text-orange-600">
                  ${(formData.precio_acordado - formData.anticipo).toFixed(2)}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Notas
            </label>
            <textarea
              className="input min-h-[80px]"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Detalles adicionales de la orden..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : editingOrden ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Orden"
        message="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

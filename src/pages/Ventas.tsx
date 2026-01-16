import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { VentaInsert, Producto, Cliente } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { formatCurrency, formatDate, getTodayDate } from '@/lib/utils'
import { Edit2, Trash2, Search, CheckCircle, ShoppingCart, ChevronUp, ChevronDown, Calendar } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'completado', label: 'Completado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function Ventas() {
  const [ventas, setVentas] = useState<any[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortField, setSortField] = useState<string>('fecha_venta')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<any | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState<VentaInsert>({
    producto_id: '',
    cliente_id: null,
    cantidad: 1,
    precio_unitario: 0,
    precio_total: 0,
    costo_produccion: 0,
    ganancia: 0,
    fecha_venta: getTodayDate(),
    metodo_pago: '',
    estado: 'pendiente',
    notas: '',
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (formData.producto_id) {
      const producto: any = productos.find((p) => p.id === formData.producto_id)
      if (producto) {
        setFormData((prev) => ({
          ...prev,
          precio_unitario: producto.precio_venta,
          precio_total: producto.precio_venta * prev.cantidad,
        }))
      }
    }
  }, [formData.producto_id, formData.cantidad, productos])

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
            p_motivo: `Venta de producto (${cantidadVendida} unidades)`,
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
      // No lanzamos el error para no bloquear la venta, solo lo registramos
    }
  }

  async function cargarDatos() {
    try {
      setLoading(true)

      const { data: ventasData, error: errorVentas } = await supabase
        .from('ventas')
        .select(`
          *,
          productos (id, nombre, categoria),
          clientes (id, nombre)
        `)
        .order('fecha_venta', { ascending: false })

      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      const { data: clientesData, error: errorClientes } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (errorVentas || errorProductos || errorClientes) {
        throw errorVentas || errorProductos || errorClientes
      }

      setVentas(ventasData || [])
      setProductos(productosData || [])
      setClientes(clientesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.producto_id || formData.cantidad <= 0 || formData.precio_unitario <= 0) {
      toast.warning('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      // Calcular costo y ganancia
      const { data: costoData } = await supabase
        .from('v_costo_produccion_productos')
        .select('costo_produccion')
        .eq('producto_id', formData.producto_id)
        .single()

      const costoProduccion = costoData?.costo_produccion || 0
      const precioTotal = formData.precio_unitario * formData.cantidad
      const gananciaUnitaria = formData.precio_unitario - costoProduccion

      const ventaData = {
        ...formData,
        precio_total: precioTotal,
        costo_produccion: costoProduccion,
        ganancia: gananciaUnitaria,
        cliente_id: formData.cliente_id || null,
      }

      if (editingVenta) {
        const { error } = await supabase
          .from('ventas')
          .update(ventaData)
          .eq('id', editingVenta.id)

        if (error) throw error
        toast.success('Venta actualizada correctamente')
      } else {
        const { error, data: ventaCreada } = await supabase
          .from('ventas')
          .insert([ventaData])
          .select()
          .single()

        if (error) throw error

        // Descontar materiales del stock automáticamente
        await descontarMaterialesDeStock(formData.producto_id, formData.cantidad, ventaCreada.id)
        
        toast.success('Venta registrada correctamente y stock actualizado')
      }

      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error al guardar venta:', error)
      toast.error('Error al guardar venta')
    }
  }

  function openDeleteDialog(id: string) {
    setDeleteDialog({ isOpen: true, id })
  }

  function closeDeleteDialog() {
    setDeleteDialog({ isOpen: false, id: '' })
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('ventas').delete().eq('id', deleteDialog.id)

      if (error) throw error
      toast.success('Venta eliminada correctamente')
      closeDeleteDialog()
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar venta:', error)
      toast.error('Error al eliminar venta')
    } finally {
      setIsDeleting(false)
    }
  }

  async function marcarComoEntregado(id: string) {
    try {
      const { error } = await supabase
        .from('ventas')
        .update({ estado: 'entregado' })
        .eq('id', id)

      if (error) throw error
      toast.success('Venta marcada como entregada')
      cargarDatos()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      toast.error('Error al actualizar estado')
    }
  }

  function abrirModalNuevo() {
    setFormData({
      producto_id: '',
      cliente_id: null,
      cantidad: 1,
      precio_unitario: 0,
      precio_total: 0,
      costo_produccion: 0,
      ganancia: 0,
      fecha_venta: getTodayDate(),
      metodo_pago: '',
      estado: 'pendiente',
      notas: '',
    })
    setEditingVenta(null)
    setIsModalOpen(true)
  }

  function abrirModalEditar(venta: any) {
    setFormData({
      producto_id: venta.producto_id || '',
      cliente_id: venta.cliente_id,
      cantidad: venta.cantidad,
      precio_unitario: venta.precio_unitario,
      precio_total: venta.precio_total,
      costo_produccion: venta.costo_produccion,
      ganancia: venta.ganancia,
      fecha_venta: venta.fecha_venta,
      metodo_pago: venta.metodo_pago || '',
      estado: venta.estado,
      notas: venta.notas || '',
    })
    setEditingVenta(venta)
    setIsModalOpen(true)
  }

  function cerrarModal() {
    setIsModalOpen(false)
    setEditingVenta(null)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const aplicarFiltroRapido = (dias: number) => {
    const hoy = new Date()
    const desde = new Date(hoy)
    desde.setDate(desde.getDate() - dias)
    setFechaDesde(desde.toISOString().split('T')[0])
    setFechaHasta(hoy.toISOString().split('T')[0])
    setCurrentPage(1)
  }

  const limpiarFiltrosFecha = () => {
    setFechaDesde('')
    setFechaHasta('')
    setCurrentPage(1)
  }

  const ventasFiltradas = ventas.filter((v) => {
    const matchesSearch =
      v.productos?.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      v.clientes?.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      v.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesEstado = !estadoFilter || v.estado === estadoFilter
    
    // Filtro de fecha
    let matchesFecha = true
    if (fechaDesde && v.fecha_venta < fechaDesde) matchesFecha = false
    if (fechaHasta && v.fecha_venta > fechaHasta) matchesFecha = false
    
    return matchesSearch && matchesEstado && matchesFecha
  })

  // Ordenamiento
  const ventasOrdenadas = [...ventasFiltradas].sort((a, b) => {
    let aVal: any = a[sortField as keyof typeof a]
    let bVal: any = b[sortField as keyof typeof b]

    // Manejar campos anidados
    if (sortField === 'producto') {
      aVal = a.productos?.nombre || ''
      bVal = b.productos?.nombre || ''
    } else if (sortField === 'cliente') {
      aVal = a.clientes?.nombre || 'Sin cliente'
      bVal = b.clientes?.nombre || 'Sin cliente'
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalPages = Math.ceil(ventasOrdenadas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const ventasPaginadas = ventasOrdenadas.slice(startIndex, startIndex + itemsPerPage)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, estadoFilter, fechaDesde, fechaHasta])

  const getEstadoBadge = (estado: string) => {
    const variants: any = {
      pendiente: 'warning',
      completado: 'primary',
      entregado: 'success',
      cancelado: 'danger',
    }
    return <Badge variant={variants[estado] || 'secondary'}>{estado}</Badge>
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  }

  if (loading) return <Loading size="lg" text="Cargando ventas..." />

  const totalVentas = ventasOrdenadas.reduce((sum, v) => sum + v.precio_total, 0)
  const totalGanancias = ventasOrdenadas.reduce(
    (sum, v) => sum + (v.ganancia || 0) * v.cantidad,
    0
  )

  return (
    <div>
      <PageHeader
        title="Registro de Ventas"
        description="Registra y administra todas las ventas de tus productos"
        action={{ label: 'Nueva Venta', onClick: abrirModalNuevo }}
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-600">Total de Ventas</p>
          <p className="text-2xl font-bold text-gray-900">{ventasOrdenadas.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600">Ingresos Totales</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalVentas)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600">Ganancias</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalGanancias)}</p>
        </div>
      </div>

      {/* Filtros de fecha rápidos */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros rápidos:</span>
          <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido(7)}>
            Últimos 7 días
          </Button>
          <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido(30)}>
            Último mes
          </Button>
          <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido(90)}>
            Últimos 3 meses
          </Button>
          {(fechaDesde || fechaHasta) && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltrosFecha}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por producto, cliente, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
          <Select
            options={[{ value: '', label: 'Todos los estados' }, ...ESTADOS]}
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          />
          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            placeholder="Desde"
          />
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            placeholder="Hasta"
          />
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{ventasPaginadas.length}</span> de{' '}
            <span className="font-medium">{ventasOrdenadas.length}</span> ventas
          </p>
          <Select
            options={[
              { value: '10', label: '10 por página' },
              { value: '20', label: '20 por página' },
              { value: '50', label: '50 por página' },
              { value: '100', label: '100 por página' },
            ]}
            value={itemsPerPage.toString()}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fecha_venta')}
                >
                  Fecha <SortIcon field="fecha_venta" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('producto')}
                >
                  Producto <SortIcon field="producto" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cliente')}
                >
                  Cliente <SortIcon field="cliente" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cantidad')}
                >
                  Cantidad <SortIcon field="cantidad" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('precio_total')}
                >
                  Total <SortIcon field="precio_total" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('estado')}
                >
                  Estado <SortIcon field="estado" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6">
                    <EmptyState
                      icon={ShoppingCart}
                      title={searchTerm || estadoFilter ? 'No se encontraron ventas' : 'No hay ventas aún'}
                      description={
                        searchTerm || estadoFilter
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Registra tu primera venta para empezar a llevar el control'
                      }
                      actionLabel={!searchTerm && !estadoFilter ? 'Registrar Venta' : undefined}
                      onAction={!searchTerm && !estadoFilter ? abrirModalNuevo : undefined}
                    />
                  </td>
                </tr>
              ) : (
                ventasPaginadas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(venta.fecha_venta)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {venta.productos?.nombre || 'Sin producto'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(venta.precio_unitario)} c/u
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {venta.clientes?.nombre || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venta.cantidad}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(venta.precio_total)}
                    </td>
                    <td className="px-6 py-4">{getEstadoBadge(venta.estado)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {venta.estado === 'completado' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => marcarComoEntregado(venta.id)}
                          title="Marcar como entregado"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEditar(venta)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(venta.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={ventasOrdenadas.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        title={editingVenta ? 'Editar Venta' : 'Nueva Venta'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingVenta ? 'Actualizar' : 'Registrar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Producto"
              required
              options={productos.map((p) => ({ value: p.id, label: p.nombre }))}
              value={formData.producto_id || ''}
              onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
            />

            <Select
              label="Cliente"
              options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
              value={formData.cliente_id || ''}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value || null })}
            />

            <Input
              label="Cantidad"
              type="number"
              min="1"
              required
              value={formData.cantidad}
              onChange={(e) =>
                setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })
              }
            />

            <Input
              label="Precio Unitario"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.precio_unitario || ''}
              onChange={(e) =>
                setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || 0 })
              }
            />

            <Input
              label="Fecha de Venta"
              type="date"
              required
              value={formData.fecha_venta}
              onChange={(e) => setFormData({ ...formData, fecha_venta: e.target.value })}
            />

            <Select
              label="Método de Pago"
              options={METODOS_PAGO}
              value={formData.metodo_pago || ''}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
            />

            <Select
              label="Estado"
              required
              options={ESTADOS}
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            />
          </div>

          <Textarea
            label="Notas"
            rows={3}
            value={formData.notas || ''}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          />

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(formData.precio_unitario * formData.cantidad)}</span>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Venta"
        message="¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  )
}

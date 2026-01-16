import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Material, MaterialInsert } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { formatCurrency, formatDate, getTodayDate } from '@/lib/utils'
import { Edit2, Trash2, Search, History, Package, ChevronUp, ChevronDown, Calendar } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'

const UNIDADES_MEDIDA = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'gramos', label: 'Gramos' },
  { value: 'kilogramos', label: 'Kilogramos' },
  { value: 'metros', label: 'Metros' },
  { value: 'centimetros', label: 'Centímetros' },
  { value: 'litros', label: 'Litros' },
  { value: 'mililitros', label: 'Mililitros' },
  { value: 'piezas', label: 'Piezas' },
]

export function Materiales() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortField, setSortField] = useState<string>('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedMaterialHistory, setSelectedMaterialHistory] = useState<any[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; nombre: string }>({ isOpen: false, id: '', nombre: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState<MaterialInsert>({
    nombre: '',
    precio_unitario: 0,
    unidad_medida: '',
    stock_disponible: 0,
    proveedor: '',
    fecha_compra: getTodayDate(),
    notas: '',
  })

  useEffect(() => {
    cargarMateriales()
  }, [])

  async function cargarMateriales() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (error) throw error
      setMateriales(data || [])
    } catch (error) {
      console.error('Error al cargar materiales:', error)
      toast.error('Error al cargar materiales')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nombre || !formData.unidad_medida || formData.precio_unitario <= 0) {
      toast.warning('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      if (editingMaterial) {
        // Si cambió el stock, registrar movimiento
        const stockAnterior = editingMaterial.stock_disponible
        const stockNuevo = formData.stock_disponible ?? 0
        
        const { error } = await supabase
          .from('materiales')
          .update(formData)
          .eq('id', editingMaterial.id)

        if (error) throw error

        // Si hubo cambio en el stock, registrar movimiento
        if (stockAnterior !== stockNuevo) {
          const diferencia = stockNuevo - stockAnterior
          const tipo = diferencia > 0 ? 'entrada' : 'salida'
          
          // Registrar en movimientos de inventario
          await supabase.from('movimientos_inventario').insert([
            {
              material_id: editingMaterial.id,
              tipo: tipo,
              cantidad: Math.abs(diferencia),
              stock_anterior: stockAnterior,
              stock_nuevo: stockNuevo,
              motivo: diferencia > 0 ? 'Compra de material (incremento de stock)' : 'Ajuste de stock (reducción)',
            },
          ])

          // Si fue un incremento (compra), registrar en historial de compras
          if (diferencia > 0) {
            await supabase.from('historial_compras_materiales').insert([
              {
                material_id: editingMaterial.id,
                cantidad: diferencia,
                precio_unitario: formData.precio_unitario,
                total: diferencia * formData.precio_unitario,
                proveedor: formData.proveedor || null,
                fecha_compra: formData.fecha_compra || getTodayDate(),
                notas: `Compra adicional - Stock actualizado de ${stockAnterior} a ${stockNuevo} ${formData.unidad_medida}`,
              },
            ])
          }
        }

        toast.success('Material actualizado correctamente')
      } else {
        const { data, error } = await supabase
          .from('materiales')
          .insert([formData])
          .select()
          .single()

        if (error) throw error

        // Registrar compra inicial si hay stock
        if (formData.stock_disponible && formData.stock_disponible > 0 && data) {
          // Registrar en historial de compras
          await supabase.from('historial_compras_materiales').insert([
            {
              material_id: data.id,
              cantidad: formData.stock_disponible,
              precio_unitario: formData.precio_unitario,
              total: formData.stock_disponible * formData.precio_unitario,
              proveedor: formData.proveedor,
              fecha_compra: formData.fecha_compra || getTodayDate(),
            },
          ])

          // Registrar movimiento de entrada en inventario
          await supabase.from('movimientos_inventario').insert([
            {
              material_id: data.id,
              tipo: 'entrada',
              cantidad: formData.stock_disponible,
              stock_anterior: 0,
              stock_nuevo: formData.stock_disponible,
              motivo: 'Stock inicial del material',
            },
          ])
        }

        toast.success('Material creado correctamente')
      }

      cerrarModal()
      cargarMateriales()
    } catch (error) {
      console.error('Error al guardar material:', error)
      toast.error('Error al guardar material')
    }
  }

  function openDeleteDialog(id: string, nombre: string) {
    setDeleteDialog({ isOpen: true, id, nombre })
  }

  function closeDeleteDialog() {
    setDeleteDialog({ isOpen: false, id: '', nombre: '' })
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('materiales').delete().eq('id', deleteDialog.id)
      
      if (error) throw error
      toast.success('Material eliminado correctamente')
      closeDeleteDialog()
      cargarMateriales()
    } catch (error) {
      console.error('Error al eliminar material:', error)
      toast.error('Error al eliminar material')
    } finally {
      setIsDeleting(false)
    }
  }

  async function verHistorial(material: Material) {
    try {
      const { data, error } = await supabase
        .from('historial_compras_materiales')
        .select('*')
        .eq('material_id', material.id)
        .order('fecha_compra', { ascending: false })

      if (error) throw error
      setSelectedMaterialHistory(data || [])
      setIsHistoryOpen(true)
    } catch (error) {
      console.error('Error al cargar historial:', error)
      toast.error('Error al cargar historial')
    }
  }

  function abrirModalNuevo() {
    setFormData({
      nombre: '',
      precio_unitario: 0,
      unidad_medida: '',
      stock_disponible: 0,
      proveedor: '',
      fecha_compra: getTodayDate(),
      notas: '',
    })
    setEditingMaterial(null)
    setIsModalOpen(true)
  }

  function abrirModalEditar(material: Material) {
    setFormData({
      nombre: material.nombre,
      precio_unitario: material.precio_unitario,
      unidad_medida: material.unidad_medida,
      stock_disponible: material.stock_disponible,
      proveedor: material.proveedor || '',
      fecha_compra: material.fecha_compra || getTodayDate(),
      notas: material.notas || '',
    })
    setEditingMaterial(material)
    setIsModalOpen(true)
  }

  function cerrarModal() {
    setIsModalOpen(false)
    setEditingMaterial(null)
  }

  // Función para ordenar
  const handleSort = (field: string) => {
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
  }

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

  // Filtrar materiales con búsqueda debounced
  const materialesFiltrados = materiales.filter((m) => {
    const matchesSearch = m.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (m.proveedor && m.proveedor.toLowerCase().includes(debouncedSearch.toLowerCase()))
    
    const matchesFechaDesde = !fechaDesde || !m.fecha_compra || m.fecha_compra >= fechaDesde
    const matchesFechaHasta = !fechaHasta || !m.fecha_compra || m.fecha_compra <= fechaHasta
    
    return matchesSearch && matchesFechaDesde && matchesFechaHasta
  })

  // Ordenar materiales
  const materialesOrdenados = [...materialesFiltrados].sort((a, b) => {
    let aValue: any = a[sortField as keyof Material]
    let bValue: any = b[sortField as keyof Material]

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalMateriales = materialesOrdenados.length
  const totalPages = Math.ceil(totalMateriales / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const materialesPaginados = materialesOrdenados.slice(startIndex, endIndex)

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, fechaDesde, fechaHasta])

  if (loading) return <Loading size="lg" text="Cargando materiales..." />

  return (
    <div>
      <PageHeader
        title="Gestión de Materiales e Insumos"
        description="Registra y controla todos los materiales que utilizas en tu negocio"
        action={{ label: 'Nuevo Material', onClick: abrirModalNuevo }}
      />

      {/* Búsqueda y filtros */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col gap-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar material o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          {/* Filtros rápidos de fecha */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Filtrar por fecha de compra:
            </span>
            <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido(30)}>
              Últimos 30 días
            </Button>
            <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido(90)}>
              Últimos 90 días
            </Button>
            <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido(180)}>
              Últimos 6 meses
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
      {materialesFiltrados.length > 0 && (
        <div className="card p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-sm text-gray-600">
            {totalMateriales} de {materiales.length} materiales
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

      {/* Tabla de materiales */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nombre')}
                >
                  Material <SortIcon field="nombre" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('precio_unitario')}
                >
                  Precio <SortIcon field="precio_unitario" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unidad
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stock_disponible')}
                >
                  Stock <SortIcon field="stock_disponible" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('proveedor')}
                >
                  Proveedor <SortIcon field="proveedor" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materialesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6">
                    <EmptyState
                      icon={Package}
                      title={searchTerm ? 'No se encontraron materiales' : 'No hay materiales aún'}
                      description={
                        searchTerm
                          ? 'Intenta ajustar el término de búsqueda'
                          : 'Crea tu primer material para empezar a gestionar tu inventario'
                      }
                      actionLabel={!searchTerm ? 'Crear Material' : undefined}
                      onAction={!searchTerm ? abrirModalNuevo : undefined}
                    />
                  </td>
                </tr>
              ) : (
                materialesPaginados.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{material.nombre}</div>
                        {material.notas && (
                          <div className="text-sm text-gray-500">{material.notas}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(material.precio_unitario)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {material.unidad_medida}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          material.stock_disponible < 10
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {material.stock_disponible}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {material.proveedor || '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verHistorial(material)}
                        title="Ver historial"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEditar(material)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(material.id, material.nombre)}
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
      </div>

      {/* Paginación */}
      {materialesFiltrados.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalMateriales}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Modal de crear/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        title={editingMaterial ? 'Editar Material' : 'Nuevo Material'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingMaterial ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Material"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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

            <Select
              label="Unidad de Medida"
              required
              options={UNIDADES_MEDIDA}
              value={formData.unidad_medida}
              onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
            />

            <Input
              label="Stock Disponible"
              type="number"
              step="0.01"
              min="0"
              value={formData.stock_disponible || ''}
              onChange={(e) =>
                setFormData({ ...formData, stock_disponible: parseFloat(e.target.value) || 0 })
              }
            />

            <Input
              label="Proveedor"
              value={formData.proveedor || ''}
              onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
            />

            <Input
              label="Fecha de Compra"
              type="date"
              value={formData.fecha_compra || ''}
              onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
            />
          </div>

          <Textarea
            label="Notas"
            rows={3}
            value={formData.notas || ''}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal de historial */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Historial de Compras"
        size="lg"
      >
        {selectedMaterialHistory.length === 0 ? (
          <Alert variant="info">No hay historial de compras para este material</Alert>
        ) : (
          <div className="space-y-4">
            {selectedMaterialHistory.map((compra) => (
              <div key={compra.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Cantidad: {compra.cantidad}</p>
                    <p className="text-sm text-gray-600">
                      Precio unitario: {formatCurrency(compra.precio_unitario)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Proveedor: {compra.proveedor || 'No especificado'}
                    </p>
                    {compra.notas && (
                      <p className="text-sm text-gray-500 mt-1">{compra.notas}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(compra.total)}</p>
                    <p className="text-sm text-gray-500">{formatDate(compra.fecha_compra)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Material"
        message={`¿Estás seguro de que deseas eliminar el material "${deleteDialog.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  )
}

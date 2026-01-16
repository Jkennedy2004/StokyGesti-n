import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Plus, Pencil, Trash2, DollarSign, TrendingDown, Calendar, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'

interface Gasto {
  id: string
  concepto: string
  categoria: string
  monto: number
  fecha: string
  descripcion: string
  created_at: string
}

const CATEGORIAS = [
  'envio',
  'publicidad',
  'servicios',
  'herramientas',
  'otros'
]

const CATEGORIA_LABELS: Record<string, string> = {
  envio: 'Envío',
  publicidad: 'Publicidad',
  servicios: 'Servicios',
  herramientas: 'Herramientas',
  otros: 'Otros'
}

export function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortField, setSortField] = useState<string>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    concepto: '',
    categoria: 'otros',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  })

  useEffect(() => {
    cargarGastos()
  }, [])

  const cargarGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false })

      if (error) throw error
      setGastos(data || [])
    } catch (error) {
      console.error('Error al cargar gastos:', error)
      alert('Error al cargar los gastos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const gastoData = {
        concepto: formData.concepto,
        categoria: formData.categoria,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        descripcion: formData.descripcion
      }

      if (editingGasto) {
        const { error } = await supabase
          .from('gastos')
          .update(gastoData)
          .eq('id', editingGasto.id)

        if (error) throw error
        alert('Gasto actualizado exitosamente')
      } else {
        const { error } = await supabase
          .from('gastos')
          .insert([gastoData])

        if (error) throw error
        alert('Gasto registrado exitosamente')
      }

      setIsModalOpen(false)
      resetForm()
      cargarGastos()
    } catch (error) {
      console.error('Error al guardar gasto:', error)
      alert('Error al guardar el gasto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto)
    setFormData({
      concepto: gasto.concepto,
      categoria: gasto.categoria,
      monto: gasto.monto.toString(),
      fecha: gasto.fecha,
      descripcion: gasto.descripcion || ''
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
        .from('gastos')
        .delete()
        .eq('id', deleteDialog.id)

      if (error) throw error
      alert('Gasto eliminado exitosamente')
      closeDeleteDialog()
      cargarGastos()
    } catch (error) {
      console.error('Error al eliminar gasto:', error)
      alert('Error al eliminar el gasto')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      concepto: '',
      categoria: 'otros',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: ''
    })
    setEditingGasto(null)
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

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(gasto => {
    const matchesSearch = gasto.concepto.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      gasto.descripcion?.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesCategoria = filtroCategoria === 'todos' || gasto.categoria === filtroCategoria
    const matchesFechaDesde = !fechaDesde || gasto.fecha >= fechaDesde
    const matchesFechaHasta = !fechaHasta || gasto.fecha <= fechaHasta
    
    return matchesSearch && matchesCategoria && matchesFechaDesde && matchesFechaHasta
  })

  // Ordenar gastos
  const gastosOrdenados = [...gastosFiltrados].sort((a, b) => {
    let aValue: any = a[sortField as keyof Gasto]
    let bValue: any = b[sortField as keyof Gasto]

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalGastosFiltrados = gastosOrdenados.length
  const totalPages = Math.ceil(totalGastosFiltrados / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const gastosPaginados = gastosOrdenados.slice(startIndex, endIndex)

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filtroCategoria, fechaDesde, fechaHasta])

  const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + gasto.monto, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Gastos</h1>
        <Button onClick={() => {
          resetForm()
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gastos</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalGastos.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cantidad de Gastos</p>
              <p className="text-2xl font-bold">{gastosFiltrados.length}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio por Gasto</p>
              <p className="text-2xl font-bold">
                ${gastosFiltrados.length > 0 ? (totalGastos / gastosFiltrados.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col gap-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por concepto o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          {/* Filtros rápidos de fecha */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Filtrar por fecha:
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

          {/* Grid de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <Select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'todos', label: 'Todas' },
                  ...CATEGORIAS.map(cat => ({
                    value: cat,
                    label: CATEGORIA_LABELS[cat]
                  }))
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Desde</label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hasta</label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controles de ordenamiento y paginación */}
      {gastosFiltrados.length > 0 && (
        <div className="card p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-sm text-gray-600">
            {totalGastosFiltrados} de {gastos.length} gastos
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

      {/* Lista de gastos */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-4 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fecha')}
                >
                  Fecha <SortIcon field="fecha" />
                </th>
                <th
                  className="text-left p-4 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('concepto')}
                >
                  Concepto <SortIcon field="concepto" />
                </th>
                <th
                  className="text-left p-4 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('categoria')}
                >
                  Categoría <SortIcon field="categoria" />
                </th>
                <th
                  className="text-right p-4 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('monto')}
                >
                  Monto <SortIcon field="monto" />
                </th>
                <th className="text-left p-4">Descripción</th>
                <th className="text-right p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={TrendingDown}
                      title={searchTerm || filtroCategoria !== 'todos' || fechaDesde || fechaHasta ? 'No se encontraron gastos' : 'No hay gastos aún'}
                      description={
                        searchTerm || filtroCategoria !== 'todos' || fechaDesde || fechaHasta
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Registra tu primer gasto para llevar el control de tus egresos'
                      }
                      actionLabel={!searchTerm && filtroCategoria === 'todos' && !fechaDesde && !fechaHasta ? 'Registrar Gasto' : undefined}
                      onAction={!searchTerm && filtroCategoria === 'todos' && !fechaDesde && !fechaHasta ? () => setIsModalOpen(true) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                gastosPaginados.map(gasto => (
                  <tr key={gasto.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {new Date(gasto.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-4 font-medium">{gasto.concepto}</td>
                    <td className="p-4">
                      <span className="badge badge-secondary">
                        {CATEGORIA_LABELS[gasto.categoria]}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-red-600">
                      ${gasto.monto.toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                      {gasto.descripcion || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(gasto)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(gasto.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {gastosFiltrados.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalGastosFiltrados}
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
        title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Concepto *
            </label>
            <Input
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              placeholder="Ej: Envío a cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Categoría *
            </label>
            <Select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              required
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{CATEGORIA_LABELS[cat]}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Monto ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha *
              </label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción
            </label>
            <textarea
              className="input min-h-[80px]"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles adicionales del gasto..."
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
              {isLoading ? 'Guardando...' : editingGasto ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Gasto"
        message="¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

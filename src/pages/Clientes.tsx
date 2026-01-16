import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Plus, Pencil, Trash2, User, Phone, Mail, MapPin, ShoppingBag, DollarSign, Users, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'

interface Cliente {
  id: string
  nombre: string
  telefono: string
  email: string
  direccion: string
  notas: string
  created_at: string
}

interface ClienteConEstadisticas extends Cliente {
  total_compras?: number
  total_gastado?: number
  ultima_compra?: string
}

export function Clientes() {
  const [clientes, setClientes] = useState<ClienteConEstadisticas[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const debouncedSearch = useDebounce(busqueda, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortField, setSortField] = useState<string>('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConEstadisticas | null>(null)
  const [historialVentas, setHistorialVentas] = useState<any[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; nombre: string }>({ isOpen: false, id: '', nombre: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      const { data: clientesData, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (error) throw error

      // Obtener estadísticas de ventas por cliente
      const clientesConStats = await Promise.all(
        (clientesData || []).map(async (cliente) => {
          const { data: ventas } = await supabase
            .from('ventas')
            .select('precio_total, fecha_venta')
            .eq('cliente_id', cliente.id)
            .neq('estado', 'cancelado')

          const totalCompras = ventas?.length || 0
          const totalGastado = ventas?.reduce((sum, v) => sum + v.precio_total, 0) || 0
          const ultimaCompra = ventas?.[0]?.fecha_venta

          return {
            ...cliente,
            total_compras: totalCompras,
            total_gastado: totalGastado,
            ultima_compra: ultimaCompra
          }
        })
      )

      setClientes(clientesConStats)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      alert('Error al cargar los clientes')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(formData)
          .eq('id', editingCliente.id)

        if (error) throw error
        alert('Cliente actualizado exitosamente')
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([formData])

        if (error) throw error
        alert('Cliente registrado exitosamente')
      }

      setIsModalOpen(false)
      resetForm()
      cargarClientes()
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      alert('Error al guardar el cliente')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    })
    setIsModalOpen(true)
  }

  const openDeleteDialog = (id: string, nombre: string) => {
    setDeleteDialog({ isOpen: true, id, nombre })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, id: '', nombre: '' })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', deleteDialog.id)

      if (error) throw error
      alert('Cliente eliminado exitosamente')
      closeDeleteDialog()
      cargarClientes()
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      alert('Error al eliminar el cliente')
    } finally {
      setIsDeleting(false)
    }
  }

  const verHistorial = async (cliente: ClienteConEstadisticas) => {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          productos (nombre)
        `)
        .eq('cliente_id', cliente.id)
        .order('fecha_venta', { ascending: false })

      if (error) throw error
      setHistorialVentas(data || [])
      setClienteSeleccionado(cliente)
    } catch (error) {
      console.error('Error al cargar historial:', error)
      alert('Error al cargar el historial de compras')
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: ''
    })
    setEditingCliente(null)
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

  // Filtrar clientes con búsqueda debounced
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    cliente.telefono?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  // Ordenar clientes
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    let aValue: any = a[sortField as keyof ClienteConEstadisticas]
    let bValue: any = b[sortField as keyof ClienteConEstadisticas]

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }

    if (aValue === null || aValue === undefined) aValue = 0
    if (bValue === null || bValue === undefined) bValue = 0

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalClientesFiltrados = clientesOrdenados.length
  const totalPages = Math.ceil(totalClientesFiltrados / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const clientesPaginados = clientesOrdenados.slice(startIndex, endIndex)

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  const totalClientesActivos = clientesFiltrados.filter(c => (c.total_compras || 0) > 0).length
  const totalIngresos = clientesFiltrados.reduce((sum, c) => sum + (c.total_gastado || 0), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <Button onClick={() => {
          resetForm()
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold">{clientes.length}</p>
            </div>
            <User className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-green-600">{totalClientesActivos}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalIngresos.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio por Cliente</p>
              <p className="text-2xl font-bold">
                ${totalClientesActivos > 0 ? (totalIngresos / totalClientesActivos).toFixed(2) : '0.00'}
              </p>
            </div>
            <User className="w-10 h-10 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Búsqueda y controles */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar cliente por nombre, teléfono o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-0 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Controles de ordenamiento y paginación */}
      {clientesFiltrados.length > 0 && (
        <div className="card p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {totalClientesFiltrados} {totalClientesFiltrados === 1 ? 'cliente' : 'clientes'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Ordenar por:</span>
              <button
                onClick={() => handleSort('nombre')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Nombre <SortIcon field="nombre" />
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleSort('total_compras')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Compras <SortIcon field="total_compras" />
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleSort('total_gastado')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Total gastado <SortIcon field="total_gastado" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
          </div>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.length === 0 ? (
          <div className="col-span-full card">
            <EmptyState
              icon={Users}
              title={busqueda ? 'No se encontraron clientes' : 'No hay clientes aún'}
              description={
                busqueda
                  ? 'Intenta ajustar el término de búsqueda'
                  : 'Crea tu primer cliente para empezar a gestionar tu cartera'
              }
              actionLabel={!busqueda ? 'Crear Cliente' : undefined}
              onAction={!busqueda ? () => setIsModalOpen(true) : undefined}
            />
          </div>
        ) : (
          clientesPaginados.map((cliente) => (
            <div key={cliente.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{cliente.nombre}</h3>
                    {(cliente.total_compras || 0) > 0 ? (
                      <Badge variant="success">Cliente Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Sin Compras</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {cliente.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{cliente.telefono}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                )}
                {cliente.direccion && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{cliente.direccion}</span>
                  </div>
                )}
              </div>

              {/* Estadísticas del cliente */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-xs text-gray-600">Compras</p>
                  <p className="font-bold">{cliente.total_compras || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Gastado</p>
                  <p className="font-bold text-green-600">
                    ${(cliente.total_gastado || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => verHistorial(cliente)}
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Historial
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(cliente)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(cliente.id, cliente.nombre)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {clientesFiltrados.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalClientesFiltrados}
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
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre completo del cliente"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Teléfono
              </label>
              <Input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="123-456-7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dirección
            </label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notas
            </label>
            <textarea
              className="input min-h-[80px]"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Notas adicionales sobre el cliente..."
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
              {isLoading ? 'Guardando...' : editingCliente ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de historial de compras */}
      <Modal
        isOpen={clienteSeleccionado !== null}
        onClose={() => {
          setClienteSeleccionado(null)
          setHistorialVentas([])
        }}
        title={`Historial de Compras - ${clienteSeleccionado?.nombre}`}
      >
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-xl font-bold">{historialVentas.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-xl font-bold text-green-600">
                ${historialVentas.reduce((sum, v) => sum + v.precio_total, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Última Compra</p>
              <p className="text-sm font-semibold">
                {historialVentas.length > 0 
                  ? new Date(historialVentas[0].fecha_venta).toLocaleDateString('es-ES')
                  : '-'
                }
              </p>
            </div>
          </div>

          {/* Lista de compras */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {historialVentas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Este cliente aún no tiene compras registradas
              </p>
            ) : (
              historialVentas.map((venta) => (
                <div key={venta.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{venta.productos?.nombre || 'Producto eliminado'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(venta.fecha_venta).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        venta.estado === 'entregado' ? 'success' :
                        venta.estado === 'pendiente' ? 'warning' :
                        venta.estado === 'cancelado' ? 'danger' :
                        'secondary'
                      }
                    >
                      {venta.estado}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Cantidad: {venta.cantidad}
                    </span>
                    <span className="font-bold text-green-600">
                      ${venta.precio_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar al cliente "${deleteDialog.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

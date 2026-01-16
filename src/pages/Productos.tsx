import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Producto, ProductoInsert, Material } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { formatCurrency, calcularMargenGanancia } from '@/lib/utils'
import { Edit2, Trash2, Search, Plus, X, Package, ChevronUp, ChevronDown } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'

interface MaterialProducto {
  material_id: string
  cantidad: number
  material?: Material
}

export function Productos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortField, setSortField] = useState<string>('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; nombre: string }>({ isOpen: false, id: '', nombre: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState<ProductoInsert>({
    nombre: '',
    categoria: '',
    descripcion: '',
    precio_venta: 0,
    tiempo_elaboracion: 0,
    foto_url: '',
    activo: true,
  })

  const [materialesProducto, setMaterialesProducto] = useState<MaterialProducto[]>([])
  const [costoProduccion, setCostoProduccion] = useState(0)

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    calcularCostoProduccion()
  }, [materialesProducto, materiales])

  async function cargarDatos() {
    try {
      setLoading(true)
      
      // Cargar productos con sus materiales
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select(`
          *,
          producto_materiales (
            id,
            cantidad,
            material_id,
            materiales (*)
          )
        `)
        .order('nombre')

      if (errorProductos) throw errorProductos

      // Cargar materiales disponibles
      const { data: materialesData, error: errorMateriales } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (errorMateriales) throw errorMateriales

      setProductos(productosData || [])
      setMateriales(materialesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  function calcularCostoProduccion() {
    let costo = 0
    materialesProducto.forEach((mp) => {
      const material = materiales.find((m) => m.id === mp.material_id)
      if (material) {
        costo += material.precio_unitario * mp.cantidad
      }
    })
    setCostoProduccion(costo)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nombre || !formData.categoria || formData.precio_venta <= 0) {
      toast.warning('Por favor completa todos los campos obligatorios')
      return
    }

    if (materialesProducto.length === 0) {
      toast.warning('Debes agregar al menos un material al producto')
      return
    }

    try {
      let productoId: string

      if (editingProducto) {
        const { error } = await supabase
          .from('productos')
          .update(formData)
          .eq('id', editingProducto.id)

        if (error) throw error

        // Eliminar materiales antiguos
        await supabase
          .from('producto_materiales')
          .delete()
          .eq('producto_id', editingProducto.id)

        productoId = editingProducto.id
        toast.success('Producto actualizado correctamente')
      } else {
        const { data, error } = await supabase
          .from('productos')
          .insert([formData])
          .select()
          .single()

        if (error) throw error
        productoId = data.id
        toast.success('Producto creado correctamente')
      }

      // Agregar materiales al producto
      const materialesInsert = materialesProducto.map((mp) => ({
        producto_id: productoId,
        material_id: mp.material_id,
        cantidad: mp.cantidad,
      }))

      const { error: errorMateriales } = await supabase
        .from('producto_materiales')
        .insert(materialesInsert)

      if (errorMateriales) throw errorMateriales

      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error al guardar producto:', error)
      toast.error('Error al guardar producto')
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
      const { error } = await supabase.from('productos').delete().eq('id', deleteDialog.id)

      if (error) throw error
      toast.success('Producto eliminado correctamente')
      closeDeleteDialog()
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      toast.error('Error al eliminar producto')
    } finally {
      setIsDeleting(false)
    }
  }

  function abrirModalNuevo() {
    setFormData({
      nombre: '',
      categoria: '',
      descripcion: '',
      precio_venta: 0,
      tiempo_elaboracion: 0,
      foto_url: '',
      activo: true,
    })
    setMaterialesProducto([])
    setEditingProducto(null)
    setIsModalOpen(true)
  }

  function abrirModalEditar(producto: any) {
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      descripcion: producto.descripcion,
      precio_venta: producto.precio_venta,
      tiempo_elaboracion: producto.tiempo_elaboracion,
      foto_url: producto.foto_url,
      activo: producto.activo,
    })

    const mats = producto.producto_materiales?.map((pm: any) => ({
      material_id: pm.material_id,
      cantidad: pm.cantidad,
      material: pm.materiales,
    })) || []

    setMaterialesProducto(mats)
    setEditingProducto(producto)
    setIsModalOpen(true)
  }

  function cerrarModal() {
    setIsModalOpen(false)
    setEditingProducto(null)
    setMaterialesProducto([])
  }

  function agregarMaterial(materialId: string) {
    if (!materialId) return
    if (materialesProducto.find((m) => m.material_id === materialId)) {
      toast.warning('Este material ya está agregado')
      return
    }

    const material = materiales.find((m) => m.id === materialId)
    setMaterialesProducto([
      ...materialesProducto,
      { material_id: materialId, cantidad: 1, material },
    ])
  }

  function eliminarMaterial(materialId: string) {
    setMaterialesProducto(materialesProducto.filter((m) => m.material_id !== materialId))
  }

  function actualizarCantidadMaterial(materialId: string, cantidad: number) {
    setMaterialesProducto(
      materialesProducto.map((m) =>
        m.material_id === materialId ? { ...m, cantidad } : m
      )
    )
  }

  // Obtener categorías únicas
  const categorias = Array.from(new Set(productos.map((p) => p.categoria))).filter(Boolean)

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

  // Filtrar productos con búsqueda debounced
  const productosFiltrados = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesCategoria = !categoriaFilter || p.categoria === categoriaFilter
    return matchesSearch && matchesCategoria
  })

  // Ordenar productos
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a]
    let bValue: any = b[sortField as keyof typeof b]

    // Manejar campos especiales
    if (sortField === 'costo') {
      aValue = calcularDatosProducto(a).costo
      bValue = calcularDatosProducto(b).costo
    } else if (sortField === 'ganancia') {
      aValue = calcularDatosProducto(a).ganancia
      bValue = calcularDatosProducto(b).ganancia
    } else if (sortField === 'margen') {
      aValue = calcularDatosProducto(a).margen
      bValue = calcularDatosProducto(b).margen
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalProductos = productosOrdenados.length
  const totalPages = Math.ceil(totalProductos / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const productosPaginados = productosOrdenados.slice(startIndex, endIndex)

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, categoriaFilter])

  // Calcular costo y ganancia por producto
  function calcularDatosProducto(producto: any) {
    let costo = 0
    producto.producto_materiales?.forEach((pm: any) => {
      if (pm.materiales) {
        costo += pm.materiales.precio_unitario * pm.cantidad
      }
    })

    const ganancia = producto.precio_venta - costo
    const margen = calcularMargenGanancia(producto.precio_venta, costo)

    return { costo, ganancia, margen }
  }

  if (loading) return <Loading size="lg" text="Cargando productos..." />

  return (
    <div>
      <PageHeader
        title="Gestión de Productos"
        description="Crea y administra los productos que fabricas con sus materiales y costos"
        action={{ label: 'Nuevo Producto', onClick: abrirModalNuevo }}
      />

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus-visible:ring-0"
          />
        </div>
        <div className="md:w-64">
          <Select
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categorias.map((c) => ({ value: c, label: c })),
            ]}
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Controles de ordenamiento y paginación */}
      {productosFiltrados.length > 0 && (
        <div className="card p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}
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
                onClick={() => handleSort('categoria')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Categoría <SortIcon field="categoria" />
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleSort('precio_venta')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Precio <SortIcon field="precio_venta" />
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleSort('ganancia')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Ganancia <SortIcon field="ganancia" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Por página:</span>
            <Select
              options={[
                { value: '12', label: '12' },
                { value: '24', label: '24' },
                { value: '48', label: '48' },
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

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productosFiltrados.length === 0 ? (
          <div className="col-span-full card">
            <EmptyState
              icon={Package}
              title={searchTerm || categoriaFilter ? 'No se encontraron productos' : 'No hay productos aún'}
              description={
                searchTerm || categoriaFilter
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primer producto para empezar a gestionar tu inventario'
              }
              actionLabel={!searchTerm && !categoriaFilter ? 'Crear Producto' : undefined}
              onAction={!searchTerm && !categoriaFilter ? abrirModalNuevo : undefined}
            />
          </div>
        ) : (
          productosPaginados.map((producto: any) => {
            const { costo, ganancia, margen } = calcularDatosProducto(producto)

            return (
              <div key={producto.id} className="card overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {producto.categoria}
                      </Badge>
                    </div>
                    {!producto.activo && (
                      <Badge variant="warning">Inactivo</Badge>
                    )}
                  </div>

                  {producto.descripcion && (
                    <p className="text-sm text-gray-600 mb-4">
                      {producto.descripcion}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Costo de producción:</span>
                      <span className="font-medium">{formatCurrency(costo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio de venta:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(producto.precio_venta)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ganancia:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(ganancia)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margen:</span>
                      <span className="font-medium">{margen.toFixed(1)}%</span>
                    </div>
                  </div>

                  {producto.producto_materiales?.length > 0 && (
                    <div className="border-t pt-3 mb-4">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Materiales ({producto.producto_materiales.length})
                      </p>
                      <div className="space-y-1">
                        {producto.producto_materiales.slice(0, 3).map((pm: any) => (
                          <p key={pm.id} className="text-xs text-gray-600">
                            • {pm.materiales?.nombre || 'Material'} ({pm.cantidad}{' '}
                            {pm.materiales?.unidad_medida || ''})
                          </p>
                        ))}
                        {producto.producto_materiales.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{producto.producto_materiales.length - 3} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => abrirModalEditar(producto)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(producto.id, producto.nombre)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Paginación */}
      {productosFiltrados.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalProductos}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Modal de crear/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingProducto ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h4 className="font-medium">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Producto"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />

              <Input
                label="Categoría"
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="ej: cuadros, llaveros, chocobombas"
              />

              <Input
                label="Precio de Venta"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.precio_venta || ''}
                onChange={(e) =>
                  setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })
                }
              />

              <Input
                label="Tiempo de Elaboración (minutos)"
                type="number"
                min="0"
                value={formData.tiempo_elaboracion || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tiempo_elaboracion: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <Textarea
              label="Descripción"
              rows={2}
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="activo" className="text-sm">
                Producto activo
              </label>
            </div>
          </div>

          {/* Materiales */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Materiales del Producto</h4>
              <div className="flex items-center gap-2">
                <Select
                  options={materiales.map((m) => ({ value: m.id, label: m.nombre }))}
                  onChange={(e) => agregarMaterial(e.target.value)}
                  value=""
                />
                <Button type="button" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {materialesProducto.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay materiales agregados
              </p>
            ) : (
              <div className="space-y-2">
                {materialesProducto.map((mp) => {
                  const material = mp.material || materiales.find((m) => m.id === mp.material_id)
                  const subtotal = material ? material.precio_unitario * mp.cantidad : 0

                  return (
                    <div
                      key={mp.material_id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{material?.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(material?.precio_unitario || 0)} /{' '}
                          {material?.unidad_medida}
                        </p>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={mp.cantidad}
                        onChange={(e) =>
                          actualizarCantidadMaterial(
                            mp.material_id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-600 w-24 text-right">
                        {formatCurrency(subtotal)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => eliminarMaterial(mp.material_id)}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  )
                })}

                <div className="border-t pt-3 flex justify-between items-center font-medium">
                  <span>Costo de Producción:</span>
                  <span className="text-lg">{formatCurrency(costoProduccion)}</span>
                </div>

                {formData.precio_venta > 0 && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ganancia:</span>
                      <span
                        className={
                          formData.precio_venta - costoProduccion >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {formatCurrency(formData.precio_venta - costoProduccion)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margen:</span>
                      <span>
                        {calcularMargenGanancia(formData.precio_venta, costoProduccion).toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar el producto "${deleteDialog.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Plus, AlertTriangle, TrendingUp, TrendingDown, Package, History } from 'lucide-react'

interface Material {
  id: string
  nombre: string
  stock_disponible: number
  unidad_medida: string
  precio_unitario: number
  proveedor: string
}

interface MovimientoInventario {
  id: string
  material_id: string
  tipo: string
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string
  fecha: string
  materiales: {
    nombre: string
    unidad_medida: string
  }
}

const TIPO_MOVIMIENTO = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' }
]

export function Inventario() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [vistaActual, setVistaActual] = useState<'stock' | 'movimientos'>('stock')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  
  const [formData, setFormData] = useState({
    material_id: '',
    tipo: 'entrada',
    cantidad: '',
    motivo: ''
  })

  useEffect(() => {
    cargarMateriales()
    cargarMovimientos()
  }, [])

  const cargarMateriales = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre')

      if (error) throw error
      setMateriales(data || [])
    } catch (error) {
      console.error('Error al cargar materiales:', error)
    }
  }

  const cargarMovimientos = async () => {
    try {
      const { data, error }: any = await supabase
        .from('movimientos_inventario')
        .select(`
          *,
          materiales (
            nombre,
            unidad_medida
          )
        `)
        .order('fecha', { ascending: false })
        .limit(100)

      if (error) throw error
      setMovimientos(data || [])
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const cantidad = parseFloat(formData.cantidad)
      
      // Llamar a la función de PostgreSQL para actualizar stock
      const { error } = await supabase.rpc('actualizar_stock_material', {
        p_material_id: formData.material_id,
        p_cantidad: cantidad,
        p_tipo: formData.tipo,
        p_motivo: formData.motivo || null,
        p_referencia_id: null
      })

      if (error) throw error
      
      alert('Movimiento de inventario registrado exitosamente')
      setIsModalOpen(false)
      resetForm()
      cargarMateriales()
      cargarMovimientos()
    } catch (error: any) {
      console.error('Error al registrar movimiento:', error)
      alert(`Error al registrar el movimiento: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      material_id: '',
      tipo: 'entrada',
      cantidad: '',
      motivo: ''
    })
  }

  const materialesStockBajo = materiales.filter(m => m.stock_disponible < 10)
  const valorTotalInventario = materiales.reduce((sum, m) => sum + (m.stock_disponible * m.precio_unitario), 0)

  const movimientosFiltrados = filtroTipo === 'todos' 
    ? movimientos 
    : movimientos.filter(m => m.tipo === filtroTipo)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Control de Inventario</h1>
        <Button onClick={() => {
          resetForm()
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Materiales</p>
              <p className="text-2xl font-bold">{materiales.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">{materialesStockBajo.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${valorTotalInventario.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Movimientos</p>
              <p className="text-2xl font-bold">{movimientos.length}</p>
            </div>
            <History className="w-10 h-10 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {materialesStockBajo.length > 0 && (
        <div className="card p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Alerta de Stock Bajo</h3>
              <div className="flex flex-wrap gap-2">
                {materialesStockBajo.map(material => (
                  <Badge key={material.id} variant="danger">
                    {material.nombre}: {material.stock_disponible} {material.unidad_medida}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={vistaActual === 'stock' ? 'primary' : 'outline'}
          onClick={() => setVistaActual('stock')}
        >
          <Package className="w-4 h-4 mr-2" />
          Stock Actual
        </Button>
        <Button
          variant={vistaActual === 'movimientos' ? 'primary' : 'outline'}
          onClick={() => setVistaActual('movimientos')}
        >
          <History className="w-4 h-4 mr-2" />
          Historial de Movimientos
        </Button>
      </div>

      {/* Vista de Stock Actual */}
      {vistaActual === 'stock' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Material</th>
                  <th className="text-right p-4">Stock Actual</th>
                  <th className="text-left p-4">Unidad</th>
                  <th className="text-right p-4">Precio Unit.</th>
                  <th className="text-right p-4">Valor Total</th>
                  <th className="text-left p-4">Proveedor</th>
                  <th className="text-center p-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {materiales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      No hay materiales registrados
                    </td>
                  </tr>
                ) : (
                  materiales.map((material) => {
                    const valorTotal = material.stock_disponible * material.precio_unitario
                    const stockBajo = material.stock_disponible < 10
                    
                    return (
                      <tr key={material.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{material.nombre}</td>
                        <td className={`p-4 text-right font-bold ${stockBajo ? 'text-red-600' : ''}`}>
                          {Math.floor(material.stock_disponible)}
                        </td>
                        <td className="p-4">{material.unidad_medida}</td>
                        <td className="p-4 text-right">${material.precio_unitario.toFixed(2)}</td>
                        <td className="p-4 text-right font-semibold">${valorTotal.toFixed(2)}</td>
                        <td className="p-4 text-sm text-gray-600">{material.proveedor || '-'}</td>
                        <td className="p-4 text-center">
                          {stockBajo ? (
                            <Badge variant="danger">Stock Bajo</Badge>
                          ) : (
                            <Badge variant="success">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista de Movimientos */}
      {vistaActual === 'movimientos' && (
        <>
          <div className="card p-4 mb-4">
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium">Filtrar por tipo:</label>
              <Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
                <option value="ajuste">Ajuste</option>
              </Select>
            </div>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Fecha</th>
                    <th className="text-left p-4">Material</th>
                    <th className="text-left p-4">Tipo</th>
                    <th className="text-right p-4">Cantidad</th>
                    <th className="text-right p-4">Stock Anterior</th>
                    <th className="text-right p-4">Stock Nuevo</th>
                    <th className="text-left p-4">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        No hay movimientos registrados
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((movimiento) => (
                      <tr key={movimiento.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          {new Date(movimiento.fecha).toLocaleString('es-ES')}
                        </td>
                        <td className="p-4 font-medium">
                          {movimiento.materiales?.nombre || 'N/A'}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={
                              movimiento.tipo === 'entrada' ? 'success' : 
                              movimiento.tipo === 'salida' ? 'danger' : 
                              'secondary'
                            }
                          >
                            {movimiento.tipo === 'entrada' && <TrendingUp className="w-3 h-3 mr-1 inline" />}
                            {movimiento.tipo === 'salida' && <TrendingDown className="w-3 h-3 mr-1 inline" />}
                            {movimiento.tipo.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {movimiento.cantidad} {movimiento.materiales?.unidad_medida}
                        </td>
                        <td className="p-4 text-right">{movimiento.stock_anterior ? Math.floor(movimiento.stock_anterior) : '-'}</td>
                        <td className="p-4 text-right font-bold">{movimiento.stock_nuevo ? Math.floor(movimiento.stock_nuevo) : '-'}</td>
                        <td className="p-4 text-sm text-gray-600">{movimiento.motivo || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de nuevo movimiento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Nuevo Movimiento de Inventario"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Material *
            </label>
            <Select
              value={formData.material_id}
              onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
              required
            >
              <option value="">Seleccionar material...</option>
              {materiales.map(material => (
                <option key={material.id} value={material.id}>
                  {material.nombre} (Stock: {Math.floor(material.stock_disponible)} {material.unidad_medida})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de Movimiento *
            </label>
            <Select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              required
            >
              {TIPO_MOVIMIENTO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cantidad *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.tipo === 'entrada' && '✓ Incrementará el stock'}
              {formData.tipo === 'salida' && '✓ Reducirá el stock'}
              {formData.tipo === 'ajuste' && '✓ Establecerá el stock a este valor exacto'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Motivo
            </label>
            <textarea
              className="input min-h-[80px]"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Razón del movimiento (compra, producción, ajuste por inventario, etc.)"
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
              {isLoading ? 'Guardando...' : 'Registrar Movimiento'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

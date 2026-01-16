import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Plus, Pencil, Trash2, CheckCircle, Circle, Calendar, AlertCircle, Flag, StickyNote } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

interface Nota {
  id: string
  titulo: string
  contenido: string
  prioridad: string
  fecha_recordatorio: string
  completado: boolean
  created_at: string
}

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'secondary', icon: Flag },
  { value: 'normal', label: 'Normal', color: 'primary', icon: Flag },
  { value: 'alta', label: 'Alta', color: 'danger', icon: AlertCircle }
]

export function Notas() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingNota, setEditingNota] = useState<Nota | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'completadas'>('todas')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas')
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    prioridad: 'normal',
    fecha_recordatorio: '',
    completado: false
  })

  useEffect(() => {
    cargarNotas()
  }, [])

  const cargarNotas = async () => {
    try {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .order('completado', { ascending: true })
        .order('fecha_recordatorio', { ascending: true })
        .order('prioridad', { ascending: true })

      if (error) throw error
      setNotas(data || [])
    } catch (error) {
      console.error('Error al cargar notas:', error)
      alert('Error al cargar las notas')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingNota) {
        const { error } = await supabase
          .from('notas')
          .update(formData)
          .eq('id', editingNota.id)

        if (error) throw error
        alert('Nota actualizada exitosamente')
      } else {
        const { error } = await supabase
          .from('notas')
          .insert([formData])

        if (error) throw error
        alert('Nota creada exitosamente')
      }

      setIsModalOpen(false)
      resetForm()
      cargarNotas()
    } catch (error) {
      console.error('Error al guardar nota:', error)
      alert('Error al guardar la nota')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (nota: Nota) => {
    setEditingNota(nota)
    setFormData({
      titulo: nota.titulo,
      contenido: nota.contenido || '',
      prioridad: nota.prioridad,
      fecha_recordatorio: nota.fecha_recordatorio || '',
      completado: nota.completado
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
        .from('notas')
        .delete()
        .eq('id', deleteDialog.id)

      if (error) throw error
      alert('Nota eliminada exitosamente')
      closeDeleteDialog()
      cargarNotas()
    } catch (error) {
      console.error('Error al eliminar nota:', error)
      alert('Error al eliminar la nota')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleCompletado = async (id: string, completado: boolean) => {
    try {
      const { error } = await supabase
        .from('notas')
        .update({ completado: !completado })
        .eq('id', id)

      if (error) throw error
      cargarNotas()
    } catch (error) {
      console.error('Error al actualizar nota:', error)
      alert('Error al actualizar la nota')
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      prioridad: 'normal',
      fecha_recordatorio: '',
      completado: false
    })
    setEditingNota(null)
  }

  const notasFiltradas = notas.filter(nota => {
    if (filtro === 'pendientes' && nota.completado) return false
    if (filtro === 'completadas' && !nota.completado) return false
    if (filtroPrioridad !== 'todas' && nota.prioridad !== filtroPrioridad) return false
    return true
  })

  const estadisticas = {
    total: notas.length,
    pendientes: notas.filter(n => !n.completado).length,
    completadas: notas.filter(n => n.completado).length,
    alta: notas.filter(n => n.prioridad === 'alta' && !n.completado).length,
    conRecordatorio: notas.filter(n => n.fecha_recordatorio && !n.completado).length,
    vencidas: notas.filter(n => {
      if (!n.fecha_recordatorio || n.completado) return false
      return new Date(n.fecha_recordatorio) < new Date()
    }).length
  }

  const getPrioridadBadge = (prioridad: string) => {
    const config = PRIORIDADES.find(p => p.value === prioridad)
    if (!config) return null
    
    const Icon = config.icon
    return (
      <Badge variant={config.color as any}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {config.label}
      </Badge>
    )
  }

  const esVencida = (fecha: string) => {
    if (!fecha) return false
    return new Date(fecha) < new Date()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notas y Recordatorios</h1>
        <Button onClick={() => {
          resetForm()
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Nota
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold">{estadisticas.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-orange-600">{estadisticas.pendientes}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 mb-1">Completadas</p>
          <p className="text-2xl font-bold text-green-600">{estadisticas.completadas}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 mb-1">Alta Prioridad</p>
          <p className="text-2xl font-bold text-red-600">{estadisticas.alta}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 mb-1">Con Recordatorio</p>
          <p className="text-2xl font-bold text-blue-600">{estadisticas.conRecordatorio}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 mb-1">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{estadisticas.vencidas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <Button
              variant={filtro === 'todas' ? 'primary' : 'outline'}
              onClick={() => setFiltro('todas')}
              size="sm"
            >
              Todas
            </Button>
            <Button
              variant={filtro === 'pendientes' ? 'primary' : 'outline'}
              onClick={() => setFiltro('pendientes')}
              size="sm"
            >
              Pendientes
            </Button>
            <Button
              variant={filtro === 'completadas' ? 'primary' : 'outline'}
              onClick={() => setFiltro('completadas')}
              size="sm"
            >
              Completadas
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Prioridad:</label>
            <Select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de notas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notasFiltradas.length === 0 ? (
          <div className="col-span-full card">
            <EmptyState
              icon={StickyNote}
              title={filtro !== 'todas' || filtroPrioridad !== 'todas' ? 'No se encontraron notas' : 'No hay notas aún'}
              description={
                filtro !== 'todas' || filtroPrioridad !== 'todas'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primera nota para empezar a organizar tus recordatorios'
              }
              actionLabel={filtro === 'todas' && filtroPrioridad === 'todas' ? 'Crear Nota' : undefined}
              onAction={filtro === 'todas' && filtroPrioridad === 'todas' ? () => setIsModalOpen(true) : undefined}
            />
          </div>
        ) : (
          notasFiltradas.map((nota) => {
            const vencida = esVencida(nota.fecha_recordatorio)
            
            return (
              <div 
                key={nota.id} 
                className={`card p-4 hover:shadow-lg transition-shadow ${
                  nota.completado ? 'bg-gray-50 opacity-75' : ''
                } ${
                  vencida && !nota.completado ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <button
                      onClick={() => toggleCompletado(nota.id, nota.completado)}
                      className="mt-1"
                    >
                      {nota.completado ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${nota.completado ? 'line-through text-gray-500' : ''}`}>
                        {nota.titulo}
                      </h3>
                    </div>
                  </div>
                  {getPrioridadBadge(nota.prioridad)}
                </div>

                {nota.contenido && (
                  <p className={`text-sm mb-3 ${nota.completado ? 'text-gray-500' : 'text-gray-700'}`}>
                    {nota.contenido}
                  </p>
                )}

                {nota.fecha_recordatorio && (
                  <div className={`flex items-center gap-2 text-sm mb-3 p-2 rounded ${
                    vencida && !nota.completado ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(nota.fecha_recordatorio).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    {vencida && !nota.completado && (
                      <Badge variant="danger" className="ml-auto">Vencida</Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(nota)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(nota.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingNota ? 'Editar Nota' : 'Nueva Nota'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Título *
            </label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título de la nota"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Contenido
            </label>
            <textarea
              className="input min-h-[120px]"
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="Escribe aquí los detalles de tu nota..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Prioridad *
              </label>
              <Select
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                required
              >
                {PRIORIDADES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha Recordatorio
              </label>
              <Input
                type="date"
                value={formData.fecha_recordatorio}
                onChange={(e) => setFormData({ ...formData, fecha_recordatorio: e.target.value })}
              />
            </div>
          </div>

          {editingNota && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <input
                type="checkbox"
                id="completado"
                checked={formData.completado}
                onChange={(e) => setFormData({ ...formData, completado: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="completado" className="text-sm font-medium cursor-pointer">
                Marcar como completada
              </label>
            </div>
          )}

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
              {isLoading ? 'Guardando...' : editingNota ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Nota"
        message="¿Estás seguro de que deseas eliminar esta nota? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

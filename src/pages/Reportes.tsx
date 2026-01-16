import { useState, useEffect } from 'react'
import { Download, Calendar, Filter, TrendingUp, Package, DollarSign, ShoppingCart, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'
import { useToast } from '../hooks/useToast'
import {
  generarReporteVentas,
  generarReporteInventario,
  generarReporteGastos,
  generarReporteOrdenes,
  generarReporteClientes,
  type TipoReporte,
  type FormatoExportacion
} from '../lib/reports'

interface ReporteConfig {
  tipo: TipoReporte
  nombre: string
  descripcion: string
  icon: any
  requiereFechas: boolean
  color: string
}

const REPORTES_DISPONIBLES: ReporteConfig[] = [
  {
    tipo: 'ventas',
    nombre: 'Reporte de Ventas',
    descripcion: 'Historial completo de ventas con totales y estadísticas',
    icon: TrendingUp,
    requiereFechas: true,
    color: 'text-green-600 bg-green-100'
  },
  {
    tipo: 'inventario',
    nombre: 'Reporte de Inventario',
    descripcion: 'Estado actual del inventario con valorización',
    icon: Package,
    requiereFechas: false,
    color: 'text-blue-600 bg-blue-100'
  },
  {
    tipo: 'gastos',
    nombre: 'Reporte de Gastos',
    descripcion: 'Análisis de gastos por categoría y período',
    icon: DollarSign,
    requiereFechas: true,
    color: 'text-red-600 bg-red-100'
  },
  {
    tipo: 'ordenes',
    nombre: 'Reporte de Órdenes',
    descripcion: 'Estado de órdenes de producción y entregas',
    icon: ShoppingCart,
    requiereFechas: false,
    color: 'text-purple-600 bg-purple-100'
  },
  {
    tipo: 'clientes',
    nombre: 'Reporte de Clientes',
    descripcion: 'Análisis de clientes y comportamiento de compra',
    icon: Users,
    requiereFechas: false,
    color: 'text-orange-600 bg-orange-100'
  }
]

export default function Reportes() {
  const { error: showError, success: showSuccess } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [reporteSeleccionado, setReporteSeleccionado] = useState<TipoReporte | null>(null)
  const [formato, setFormato] = useState<FormatoExportacion>('pdf')
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

  // Datos
  const [ventas, setVentas] = useState<any[]>([])
  const [materiales, setMateriales] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Cargar todos los datos necesarios
      const [ventasRes, materialesRes, gastosRes, ordenesRes, clientesRes] = await Promise.all([
        supabase
          .from('ventas')
          .select('*, clientes(nombre), productos(nombre)')
          .order('fecha_venta', { ascending: false }),
        supabase
          .from('materiales')
          .select('*')
          .order('nombre'),
        supabase
          .from('gastos')
          .select('*')
          .order('fecha', { ascending: false }),
        supabase
          .from('ordenes_pendientes')
          .select('*, clientes(nombre), productos(nombre)')
          .order('fecha_pedido', { ascending: false }),
        supabase
          .from('clientes')
          .select('*')
          .order('nombre')
      ])

      if (ventasRes.data) setVentas(ventasRes.data)
      if (materialesRes.data) setMateriales(materialesRes.data)
      if (gastosRes.data) setGastos(gastosRes.data)
      if (ordenesRes.data) setOrdenes(ordenesRes.data)
      if (clientesRes.data) setClientes(clientesRes.data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      showError('Error al cargar datos')
    }
  }

  const generarReporte = async () => {
    if (!reporteSeleccionado) {
      showError('Selecciona un tipo de reporte')
      return
    }

    setIsLoading(true)

    try {
      
      switch (reporteSeleccionado) {
        case 'ventas':
          const ventasFiltradas = ventas.filter(v => {
            const fecha = new Date(v.fecha_venta)
            const inicio = new Date(fechaInicio)
            const fin = new Date(fechaFin)
            
            // Ajustar las horas para comparar solo fechas
            fecha.setHours(0, 0, 0, 0)
            inicio.setHours(0, 0, 0, 0)
            fin.setHours(23, 59, 59, 999)
            
            return fecha >= inicio && fecha <= fin
          })
          
          if (ventasFiltradas.length === 0) {
            showError('No hay ventas en el período seleccionado')
            setIsLoading(false)
            return
          }
          
          await generarReporteVentas(ventasFiltradas, fechaInicio, fechaFin, formato)
          break

        case 'inventario':
          if (materiales.length === 0) {
            showError('No hay materiales registrados')
            setIsLoading(false)
            return
          }
          await generarReporteInventario(materiales, formato)
          break

        case 'gastos':
          const gastosFiltrados = gastos.filter(g => {
            const fecha = new Date(g.fecha)
            const inicio = new Date(fechaInicio)
            const fin = new Date(fechaFin)
            
            fecha.setHours(0, 0, 0, 0)
            inicio.setHours(0, 0, 0, 0)
            fin.setHours(23, 59, 59, 999)
            
            return fecha >= inicio && fecha <= fin
          })
          
          if (gastosFiltrados.length === 0) {
            showError('No hay gastos en el período seleccionado')
            setIsLoading(false)
            return
          }
          
          await generarReporteGastos(gastosFiltrados, fechaInicio, fechaFin, formato)
          break

        case 'ordenes':
          if (ordenes.length === 0) {
            showError('No hay órdenes registradas')
            setIsLoading(false)
            return
          }
          await generarReporteOrdenes(ordenes, formato)
          break

        case 'clientes':
          if (clientes.length === 0) {
            showError('No hay clientes registrados')
            setIsLoading(false)
            return
          }
          await generarReporteClientes(clientes, ventas, formato)
          break
      }

      showSuccess(`Reporte ${formato.toUpperCase()} generado exitosamente`)
    } catch (error) {
      console.error('Error al generar reporte:', error)
      showError('Error al generar el reporte')
    } finally {
      setIsLoading(false)
    }
  }

  const reporteConfig = reporteSeleccionado 
    ? REPORTES_DISPONIBLES.find(r => r.tipo === reporteSeleccionado)
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Genera y exporta reportes del sistema"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REPORTES_DISPONIBLES.map((reporte) => {
          const Icon = reporte.icon
          const isSelected = reporteSeleccionado === reporte.tipo
          
          // Contar registros disponibles
          let cantidadRegistros = 0
          switch (reporte.tipo) {
            case 'ventas':
              cantidadRegistros = ventas.length
              break
            case 'inventario':
              cantidadRegistros = materiales.length
              break
            case 'gastos':
              cantidadRegistros = gastos.length
              break
            case 'ordenes':
              cantidadRegistros = ordenes.length
              break
            case 'clientes':
              cantidadRegistros = clientes.length
              break
          }

          return (
            <div
              key={reporte.tipo}
              className={`card cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setReporteSeleccionado(reporte.tipo)}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${reporte.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {reporte.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {reporte.descripcion}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {reporte.requiereFechas && (
                        <Badge variant="secondary">
                          <Calendar className="w-3 h-3 mr-1" />
                          Requiere fechas
                        </Badge>
                      )}
                      <Badge variant={cantidadRegistros > 0 ? "success" : "danger"}>
                        {cantidadRegistros} registro{cantidadRegistros !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reporteSeleccionado && reporteConfig && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              {(() => {
                const Icon = reporteConfig.icon
                return <Icon className="w-6 h-6 text-blue-600" />
              })()}
              <div>
                <h2 className="text-xl font-semibold">
                  {reporteConfig.nombre}
                </h2>
                <p className="text-sm text-gray-600">
                  Configura los parámetros del reporte
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Formato de Exportación
                </label>
                <Select
                  value={formato}
                  onChange={(e) => setFormato(e.target.value as FormatoExportacion)}
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel (CSV)</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formato === 'pdf' 
                    ? 'Documento PDF con formato profesional'
                    : 'Archivo CSV compatible con Excel'
                  }
                </p>
              </div>

              {reporteConfig.requiereFechas && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fecha Inicio
                    </label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      max={fechaFin}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fecha Fin
                    </label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      min={fechaInicio}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {reporteConfig.requiereFechas && (
                  <span>
                    Período: {new Date(fechaInicio).toLocaleDateString('es-ES')} -{' '}
                    {new Date(fechaFin).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
              
              <Button
                onClick={generarReporte}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loading size="sm" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generar {formato.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!reporteSeleccionado && (
        <Card className="p-12 text-center">
          <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Selecciona un Tipo de Reporte
          </h3>
          <p className="text-gray-600">
            Elige una de las opciones anteriores para configurar y generar tu reporte
          </p>
        </Card>
      )}
    </div>
  )
}

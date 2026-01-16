import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  calcularAnalisisFinanciero,
  calcularCostosOperativos,
  calcularRentabilidadProductos,
  evaluarSaludFinanciera,
  AnalisisFinanciero,
  RentabilidadProducto,
} from '@/lib/financial-calculations'
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function AnalisisFinancieroPage() {
  const [loading, setLoading] = useState(true)
  const [analisis, setAnalisis] = useState<AnalisisFinanciero | null>(null)
  const [rentabilidad, setRentabilidad] = useState<RentabilidadProducto[]>([])
  const [gastos, setGastos] = useState<any[]>([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setLoading(true)

      // Cargar ventas
      const { data: ventasData } = await supabase
        .from('ventas')
        .select('*')
        .neq('estado', 'cancelado')

      // Cargar gastos
      const { data: gastosData } = await supabase
        .from('gastos')
        .select('*')

      // Cargar materiales
      const { data: materialesData } = await supabase
        .from('materiales')
        .select('*')

      // Cargar productos
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')

      setGastos(gastosData || [])

      // Calcular análisis financiero
      const analisisData = calcularAnalisisFinanciero(
        ventasData || [],
        gastosData || [],
        materialesData || []
      )
      setAnalisis(analisisData)

      // Calcular rentabilidad por producto
      const rentabilidadData = calcularRentabilidadProductos(
        ventasData || [],
        productosData || []
      )
      setRentabilidad(rentabilidadData)
    } catch (error) {
      console.error('Error al cargar análisis financiero:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading size="lg" text="Calculando análisis financiero..." />
  if (!analisis) return <Alert variant="error">Error al cargar análisis</Alert>

  const costosOperativos = calcularCostosOperativos(gastos)
  const saludFinanciera = evaluarSaludFinanciera(analisis)

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

  const dataCostosOperativos = [
    { name: 'Envío', value: costosOperativos.gastosEnvio },
    { name: 'Publicidad', value: costosOperativos.gastosPublicidad },
    { name: 'Servicios', value: costosOperativos.gastosServicios },
    { name: 'Herramientas', value: costosOperativos.gastosHerramientas },
    { name: 'Otros', value: costosOperativos.gastosOtros },
  ].filter(item => item.value > 0)

  const dataGastosFijosVsVariables = [
    { name: 'Gastos Fijos', value: costosOperativos.totalGastosFijos },
    { name: 'Gastos Variables', value: costosOperativos.totalGastosVariables },
  ]

  const getBadgeColor = (nivel: string) => {
    switch (nivel) {
      case 'excelente': return 'success'
      case 'bueno': return 'primary'
      case 'regular': return 'warning'
      case 'malo': return 'danger'
      case 'critico': return 'danger'
      default: return 'secondary'
    }
  }

  return (
    <div>
      <PageHeader
        title="Análisis Financiero"
        description="Análisis completo de costos, gastos y rentabilidad de tu negocio"
      />

      {/* Salud Financiera */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              saludFinanciera.nivel === 'excelente' || saludFinanciera.nivel === 'bueno'
                ? 'bg-green-100'
                : saludFinanciera.nivel === 'regular'
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}>
              {saludFinanciera.nivel === 'excelente' || saludFinanciera.nivel === 'bueno' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Salud Financiera</h3>
              <p className="text-gray-600">{saludFinanciera.mensaje}</p>
            </div>
          </div>
          <Badge variant={getBadgeColor(saludFinanciera.nivel) as any}>
            {saludFinanciera.nivel.toUpperCase()}
          </Badge>
        </div>

        {saludFinanciera.recomendaciones.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Recomendaciones:</h4>
            <ul className="space-y-1">
              {saludFinanciera.recomendaciones.map((rec, index) => (
                <li key={index} className="text-sm text-blue-800">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(analisis.totalIngresos)}
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Utilidad Neta"
          value={formatCurrency(analisis.utilidadNeta)}
          subtitle={`Margen: ${analisis.margenNeto.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color={analisis.utilidadNeta >= 0 ? 'bg-blue-500' : 'bg-red-500'}
        />
        <MetricCard
          title="ROI"
          value={`${analisis.roi.toFixed(1)}%`}
          subtitle="Retorno de inversión"
          icon={<Zap className="w-6 h-6" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Punto de Equilibrio"
          value={`${Math.ceil(analisis.puntoEquilibrio)} ventas`}
          subtitle="Para cubrir gastos"
          icon={<Target className="w-6 h-6" />}
          color="bg-orange-500"
        />
      </div>

      {/* Desglose de Costos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="💰 Estructura de Costos">
          <div className="space-y-4">
            <CostItem
              label="Costo de Materiales"
              value={analisis.costoMateriales}
              total={analisis.costoTotal}
            />
            <CostItem
              label="Gastos Operativos"
              value={analisis.gastosOperativos}
              total={analisis.costoTotal}
            />
            <div className="border-t pt-3">
              <CostItem
                label="Costo Total"
                value={analisis.costoTotal}
                isTotal
              />
            </div>
          </div>
        </Card>

        <Card title="📊 Rentabilidad">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Ingresos</span>
              <span className="font-bold text-green-600">
                {formatCurrency(analisis.totalIngresos)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">- Costos</span>
              <span className="font-bold text-red-600">
                {formatCurrency(analisis.costoTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
              <span className="font-semibold text-blue-900">Utilidad Neta</span>
              <span className="font-bold text-xl text-blue-600">
                {formatCurrency(analisis.utilidadNeta)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-xs text-gray-600 mb-1">Margen Bruto</p>
                <p className="text-lg font-bold text-green-600">
                  {analisis.margenBruto.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-600 mb-1">Margen Neto</p>
                <p className="text-lg font-bold text-blue-600">
                  {analisis.margenNeto.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gastos por Categoría */}
        {dataCostosOperativos.length > 0 && (
          <Card title="Gastos por Categoría">
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={dataCostosOperativos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataCostosOperativos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </RePieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Gastos Fijos vs Variables */}
        <Card title="Gastos Fijos vs Variables">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataGastosFijosVsVariables}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Rentabilidad por Producto */}
      {rentabilidad.length > 0 && (
        <Card title="🎯 Rentabilidad por Producto" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unidades
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ventas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Costo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Utilidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Margen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rentabilidad.slice(0, 10).map((item) => (
                  <tr key={item.producto_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.nombre}</p>
                        <p className="text-sm text-gray-500">{item.categoria}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {item.ventasUnidades}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                      {formatCurrency(item.ventasTotales)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(item.costoProduccion)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                      {formatCurrency(item.utilidad)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={item.margenPorcentaje >= 30 ? 'success' : item.margenPorcentaje >= 20 ? 'primary' : 'warning'}>
                        {item.margenPorcentaje.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: string
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  )
}

interface CostItemProps {
  label: string
  value: number
  total?: number
  isTotal?: boolean
}

function CostItem({ label, value, total, isTotal }: CostItemProps) {
  const percentage = total ? (value / total) * 100 : 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className={`${isTotal ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
          {label}
        </p>
        {!isTotal && total && (
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
      <div className="ml-4 text-right">
        <p className={`${isTotal ? 'font-bold text-lg' : 'font-medium'} text-gray-900`}>
          {formatCurrency(value)}
        </p>
        {!isTotal && <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>}
      </div>
    </div>
  )
}

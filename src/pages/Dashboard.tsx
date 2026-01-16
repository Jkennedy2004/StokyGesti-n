import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardStats } from '@/types'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { formatCurrency } from '@/lib/utils'
import { NotificationSettings } from '@/components/ui/NotificationSettings'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ventasPorDia, setVentasPorDia] = useState<any[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([])
  const [ventasPorCategoria, setVentasPorCategoria] = useState<any[]>([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setLoading(true)
      setError(null)

      const hoy = new Date().toISOString().split('T')[0]
      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Total invertido en materiales
      const { data: materiales } = await supabase
        .from('materiales')
        .select('precio_unitario, stock_disponible')
      
      const totalInvertido = materiales?.reduce(
        (sum: number, m: any) => sum + m.precio_unitario * m.stock_disponible,
        0
      ) || 0

      // Total de ventas y ganancia
      const { data: ventas } = await supabase
        .from('ventas')
        .select('precio_total, ganancia, cantidad, fecha_venta')
        .neq('estado', 'cancelado')

      const totalVentas = ventas?.reduce((sum: number, v: any) => sum + v.precio_total, 0) || 0
      const gananciaNeta = ventas?.reduce((sum: number, v: any) => sum + (v.ganancia || 0) * v.cantidad, 0) || 0

      // Ventas de hoy
      const ventasHoy = ventas?.filter((v: any) => v.fecha_venta === hoy) || []
      const totalVentasHoy = ventasHoy.reduce((sum: number, v: any) => sum + v.precio_total, 0)

      // Ventas del mes
      const ventasMes = ventas?.filter((v: any) => v.fecha_venta >= primerDiaMes) || []
      const totalVentasMes = ventasMes.reduce((sum: number, v: any) => sum + v.precio_total, 0)

      // Productos activos
      const { count: productosActivos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true)

      // Materiales con stock bajo
      const { count: materialesStockBajo } = await supabase
        .from('materiales')
        .select('*', { count: 'exact', head: true })
        .lt('stock_disponible', 10)

      const margenGanancia = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0

      setStats({
        totalInvertido,
        totalVentas,
        gananciaNeta,
        margenGanancia,
        ventasHoy: totalVentasHoy,
        ventasMes: totalVentasMes,
        productosActivos: productosActivos || 0,
        materialesStockBajo: materialesStockBajo || 0,
      })

      // Ventas por día (últimos 7 días)
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date()
        fecha.setDate(fecha.getDate() - (6 - i))
        return fecha.toISOString().split('T')[0]
      })

      const ventasPorDiaData = ultimos7Dias.map((fecha) => {
        const ventasDia = ventas?.filter((v: any) => v.fecha_venta === fecha) || []
        const total = ventasDia.reduce((sum: number, v: any) => sum + v.precio_total, 0)
        return {
          fecha: new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
          ventas: total,
        }
      })
      setVentasPorDia(ventasPorDiaData)

      // Productos más vendidos
      const { data: productosMasVendidosData } = await supabase
        .from('v_productos_mas_vendidos')
        .select('*')
        .order('unidades_vendidas', { ascending: false })
        .limit(5)

      setProductosMasVendidos(
        productosMasVendidosData?.map((p: any) => ({
          nombre: p.nombre,
          ventas: p.unidades_vendidas,
        })) || []
      )

      // Ventas por categoría
      const categorias: Record<string, number> = {}
      const { data: productos } = await supabase.from('productos').select('id, categoria')
      
      ventas?.forEach((venta: any) => {
        const producto = productos?.find((p: any) => p.id === venta.producto_id)
        if (producto) {
          categorias[producto.categoria] = (categorias[producto.categoria] || 0) + venta.precio_total
        }
      })

      setVentasPorCategoria(
        Object.entries(categorias).map(([categoria, total]) => ({
          categoria,
          total,
        }))
      )

    } catch (err) {
      console.error('Error al cargar dashboard:', err)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading size="lg" text="Cargando dashboard..." />
  if (error) return <Alert variant="error">{error}</Alert>
  if (!stats) return <Alert variant="warning">No hay datos disponibles</Alert>

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invertido"
          value={formatCurrency(stats.totalInvertido)}
          icon={<Package className="w-6 h-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total de Ventas"
          value={formatCurrency(stats.totalVentas)}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Ganancia Neta"
          value={formatCurrency(stats.gananciaNeta)}
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Margen de Ganancia"
          value={`${stats.margenGanancia.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-orange-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-600">Ventas Hoy</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.ventasHoy)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600">Ventas del Mes</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.ventasMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600">Productos Activos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.productosActivos}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 flex items-center gap-1">
            Stock Bajo
            {stats.materialesStockBajo > 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
          </p>
          <p className="text-2xl font-bold text-gray-900">{stats.materialesStockBajo}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <Card title="Ventas Últimos 7 Días">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Productos más vendidos */}
        <Card title="Productos Más Vendidos">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productosMasVendidos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ventas" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Ventas por categoría */}
        {ventasPorCategoria.length > 0 && (
          <Card title="Ventas por Categoría">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percent }) =>
                    `${categoria}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {ventasPorCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Alertas */}
      {stats.materialesStockBajo > 0 && (
        <Alert variant="warning">
          <strong>¡Atención!</strong> Tienes {stats.materialesStockBajo} material(es) con stock bajo.
          Revisa la sección de Inventario.
        </Alert>
      )}

      {/* Configuración de notificaciones */}
      <NotificationSettings />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}

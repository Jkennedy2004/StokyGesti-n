import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  ClipboardList,
  Archive,
  StickyNote,
  TrendingUp,
  Menu,
  X,
  BarChart3,
  FileText,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'

interface LayoutProps {
  children: ReactNode
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Materiales', path: '/materiales' },
  { icon: ShoppingBag, label: 'Productos', path: '/productos' },
  { icon: DollarSign, label: 'Ventas', path: '/ventas' },
  { icon: TrendingUp, label: 'Gastos', path: '/gastos' },
  { icon: Archive, label: 'Inventario', path: '/inventario' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: ClipboardList, label: 'Órdenes', path: '/ordenes' },
  { icon: StickyNote, label: 'Notas', path: '/notas' },
  { icon: BarChart3, label: 'Análisis Financiero', path: '/analisis-financiero' },
  { icon: FileText, label: 'Reportes', path: '/reportes' },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary-600">Sistema de Gestión</h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r z-50 transition-transform duration-300',
          'lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b hidden lg:block">
            <h1 className="text-2xl font-bold text-primary-600">Sistema de Gestión</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de Negocio</p>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-16 lg:mt-0">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t space-y-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">Usuario activo</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t text-xs text-gray-500 text-center">
            © 2026 Sistema de Gestión
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}

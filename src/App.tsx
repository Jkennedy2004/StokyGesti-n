import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Materiales } from './pages/Materiales'
import { Productos } from './pages/Productos'
import { Ventas } from './pages/Ventas'
import { Gastos } from './pages/Gastos'
import { Inventario } from './pages/Inventario'
import { Clientes } from './pages/Clientes'
import { Ordenes } from './pages/Ordenes'
import { Notas } from './pages/Notas'
import { AnalisisFinancieroPage } from './pages/AnalisisFinanciero'
import Reportes from './pages/Reportes'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useNotificationMonitor } from './hooks/useNotificationMonitor'

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <LayoutWrapper />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function LayoutWrapper() {
  // Monitorear eventos para notificaciones (solo cuando está autenticado)
  useNotificationMonitor()

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/materiales" element={<Materiales />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="/notas" element={<Notas />} />
        <Route path="/analisis-financiero" element={<AnalisisFinancieroPage />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

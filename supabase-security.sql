-- =============================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- =============================================
-- Ejecutar esto en el SQL Editor de Supabase después del schema principal

-- Habilitar RLS en todas las tablas
ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_compras_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA USUARIOS AUTENTICADOS
-- =============================================
-- Los usuarios autenticados tienen acceso completo a todos los datos
-- En el futuro puedes agregar roles más específicos

-- MATERIALES
CREATE POLICY "Usuarios autenticados pueden ver materiales"
  ON materiales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar materiales"
  ON materiales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar materiales"
  ON materiales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar materiales"
  ON materiales FOR DELETE
  USING (auth.role() = 'authenticated');

-- HISTORIAL COMPRAS MATERIALES
CREATE POLICY "Usuarios autenticados pueden ver historial compras"
  ON historial_compras_materiales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar historial compras"
  ON historial_compras_materiales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- PRODUCTOS
CREATE POLICY "Usuarios autenticados pueden ver productos"
  ON productos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar productos"
  ON productos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar productos"
  ON productos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar productos"
  ON productos FOR DELETE
  USING (auth.role() = 'authenticated');

-- PRODUCTO MATERIALES
CREATE POLICY "Usuarios autenticados pueden ver producto_materiales"
  ON producto_materiales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar producto_materiales"
  ON producto_materiales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar producto_materiales"
  ON producto_materiales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar producto_materiales"
  ON producto_materiales FOR DELETE
  USING (auth.role() = 'authenticated');

-- CLIENTES
CREATE POLICY "Usuarios autenticados pueden ver clientes"
  ON clientes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar clientes"
  ON clientes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar clientes"
  ON clientes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar clientes"
  ON clientes FOR DELETE
  USING (auth.role() = 'authenticated');

-- VENTAS
CREATE POLICY "Usuarios autenticados pueden ver ventas"
  ON ventas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar ventas"
  ON ventas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar ventas"
  ON ventas FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar ventas"
  ON ventas FOR DELETE
  USING (auth.role() = 'authenticated');

-- GASTOS
CREATE POLICY "Usuarios autenticados pueden ver gastos"
  ON gastos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar gastos"
  ON gastos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar gastos"
  ON gastos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar gastos"
  ON gastos FOR DELETE
  USING (auth.role() = 'authenticated');

-- MOVIMIENTOS INVENTARIO
CREATE POLICY "Usuarios autenticados pueden ver movimientos"
  ON movimientos_inventario FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar movimientos"
  ON movimientos_inventario FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar movimientos"
  ON movimientos_inventario FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar movimientos"
  ON movimientos_inventario FOR DELETE
  USING (auth.role() = 'authenticated');

-- ORDENES PENDIENTES
CREATE POLICY "Usuarios autenticados pueden ver ordenes"
  ON ordenes_pendientes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar ordenes"
  ON ordenes_pendientes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar ordenes"
  ON ordenes_pendientes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar ordenes"
  ON ordenes_pendientes FOR DELETE
  USING (auth.role() = 'authenticated');

-- NOTAS
CREATE POLICY "Usuarios autenticados pueden ver notas"
  ON notas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar notas"
  ON notas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar notas"
  ON notas FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar notas"
  ON notas FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_movimientos_material ON movimientos_inventario(material_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes_pendientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON notas(fecha_recordatorio);
CREATE INDEX IF NOT EXISTS idx_producto_materiales_producto ON producto_materiales(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_materiales_material ON producto_materiales(material_id);

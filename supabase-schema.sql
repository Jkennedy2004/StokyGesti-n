-- Sistema de Gestión - Esquema de Base de Datos Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- =============================================
-- 1. TABLA DE MATERIALES E INSUMOS
-- =============================================
CREATE TABLE materiales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL, -- unidad, gramos, metros, litros, etc.
    stock_disponible DECIMAL(10, 2) DEFAULT 0,
    proveedor VARCHAR(255),
    fecha_compra DATE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 2. HISTORIAL DE COMPRAS DE MATERIALES
-- =============================================
CREATE TABLE historial_compras_materiales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES materiales(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    proveedor VARCHAR(255),
    fecha_compra DATE NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 3. TABLA DE PRODUCTOS
-- =============================================
CREATE TABLE productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- cuadros, llaveros, chocobombas, etc.
    descripcion TEXT,
    precio_venta DECIMAL(10, 2) NOT NULL,
    tiempo_elaboracion INTEGER, -- en minutos
    foto_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 4. TABLA DE MATERIALES POR PRODUCTO
-- =============================================
CREATE TABLE producto_materiales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materiales(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(producto_id, material_id)
);

-- =============================================
-- 5. TABLA DE CLIENTES
-- =============================================
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 6. TABLA DE VENTAS
-- =============================================
CREATE TABLE ventas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    precio_total DECIMAL(10, 2) NOT NULL,
    costo_produccion DECIMAL(10, 2),
    ganancia DECIMAL(10, 2),
    fecha_venta DATE NOT NULL,
    metodo_pago VARCHAR(50), -- efectivo, transferencia, tarjeta, etc.
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, completado, entregado, cancelado
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 7. TABLA DE GASTOS ADICIONALES
-- =============================================
CREATE TABLE gastos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- envio, publicidad, servicios, herramientas, otros
    monto DECIMAL(10, 2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 8. TABLA DE MOVIMIENTOS DE INVENTARIO
-- =============================================
CREATE TABLE movimientos_inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES materiales(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- entrada, salida, ajuste
    cantidad DECIMAL(10, 2) NOT NULL,
    stock_anterior DECIMAL(10, 2),
    stock_nuevo DECIMAL(10, 2),
    motivo VARCHAR(255),
    referencia_id UUID, -- puede ser venta_id o compra_id
    fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 9. TABLA DE ÓRDENES PENDIENTES
-- =============================================
CREATE TABLE ordenes_pendientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL,
    fecha_pedido DATE NOT NULL,
    fecha_entrega_estimada DATE,
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, en_proceso, completado, entregado
    precio_acordado DECIMAL(10, 2),
    anticipo DECIMAL(10, 2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 10. TABLA DE NOTAS Y RECORDATORIOS
-- =============================================
CREATE TABLE notas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT,
    prioridad VARCHAR(50) DEFAULT 'normal', -- baja, normal, alta
    fecha_recordatorio DATE,
    completado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- VISTAS PARA CÁLCULOS Y REPORTES
-- =============================================

-- Vista: Costo de producción por producto
CREATE OR REPLACE VIEW v_costo_produccion_productos AS
SELECT 
    p.id as producto_id,
    p.nombre as producto_nombre,
    p.categoria,
    p.precio_venta,
    COALESCE(SUM(pm.cantidad * m.precio_unitario), 0) as costo_produccion,
    p.precio_venta - COALESCE(SUM(pm.cantidad * m.precio_unitario), 0) as ganancia,
    CASE 
        WHEN p.precio_venta > 0 
        THEN ((p.precio_venta - COALESCE(SUM(pm.cantidad * m.precio_unitario), 0)) / p.precio_venta * 100)
        ELSE 0 
    END as margen_porcentaje
FROM productos p
LEFT JOIN producto_materiales pm ON p.id = pm.producto_id
LEFT JOIN materiales m ON pm.material_id = m.id
GROUP BY p.id, p.nombre, p.categoria, p.precio_venta;

-- Vista: Resumen de ventas
CREATE OR REPLACE VIEW v_resumen_ventas AS
SELECT 
    DATE_TRUNC('day', v.fecha_venta) as fecha,
    COUNT(*) as total_ventas,
    SUM(v.cantidad) as unidades_vendidas,
    SUM(v.precio_total) as ingresos_totales,
    SUM(v.costo_produccion * v.cantidad) as costos_totales,
    SUM(v.ganancia * v.cantidad) as ganancia_total
FROM ventas v
WHERE v.estado != 'cancelado'
GROUP BY DATE_TRUNC('day', v.fecha_venta);

-- Vista: Productos más vendidos
CREATE OR REPLACE VIEW v_productos_mas_vendidos AS
SELECT 
    p.id,
    p.nombre,
    p.categoria,
    COUNT(v.id) as numero_ventas,
    SUM(v.cantidad) as unidades_vendidas,
    SUM(v.precio_total) as ingresos_totales,
    SUM(v.ganancia * v.cantidad) as ganancia_total
FROM productos p
LEFT JOIN ventas v ON p.id = v.producto_id AND v.estado != 'cancelado'
GROUP BY p.id, p.nombre, p.categoria
ORDER BY unidades_vendidas DESC;

-- Vista: Stock bajo de materiales
CREATE OR REPLACE VIEW v_materiales_stock_bajo AS
SELECT 
    id,
    nombre,
    stock_disponible,
    unidad_medida,
    proveedor
FROM materiales
WHERE stock_disponible < 10
ORDER BY stock_disponible ASC;

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_materiales_updated_at BEFORE UPDATE ON materiales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ventas_updated_at BEFORE UPDATE ON ventas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gastos_updated_at BEFORE UPDATE ON gastos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON ordenes_pendientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON notas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar stock de materiales
CREATE OR REPLACE FUNCTION actualizar_stock_material(
    p_material_id UUID,
    p_cantidad DECIMAL,
    p_tipo VARCHAR,
    p_motivo VARCHAR DEFAULT NULL,
    p_referencia_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_stock_anterior DECIMAL;
    v_stock_nuevo DECIMAL;
BEGIN
    -- Obtener stock actual
    SELECT stock_disponible INTO v_stock_anterior
    FROM materiales
    WHERE id = p_material_id;

    -- Calcular nuevo stock
    IF p_tipo = 'entrada' THEN
        v_stock_nuevo := v_stock_anterior + p_cantidad;
    ELSIF p_tipo = 'salida' THEN
        v_stock_nuevo := v_stock_anterior - p_cantidad;
    ELSE
        v_stock_nuevo := p_cantidad; -- ajuste directo
    END IF;

    -- Actualizar stock
    UPDATE materiales
    SET stock_disponible = v_stock_nuevo
    WHERE id = p_material_id;

    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        material_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id
    ) VALUES (
        p_material_id, p_tipo, p_cantidad, v_stock_anterior, v_stock_nuevo, p_motivo, p_referencia_id
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================
CREATE INDEX idx_materiales_nombre ON materiales(nombre);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_gastos_categoria ON gastos(categoria);
CREATE INDEX idx_movimientos_material ON movimientos_inventario(material_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);

-- =============================================
-- POLÍTICAS RLS (Row Level Security) - Opcional
-- =============================================
-- Si necesitas seguridad a nivel de filas, descomenta lo siguiente:

-- ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política (permitir todo por ahora):
-- CREATE POLICY "Enable all access for authenticated users" ON materiales
--     FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS DE EJEMPLO (Opcional)
-- =============================================
-- Descomentar para insertar datos de prueba

-- INSERT INTO materiales (nombre, precio_unitario, unidad_medida, stock_disponible, proveedor) VALUES
-- ('Madera MDF 3mm', 15.50, 'unidad', 20, 'Maderería El Roble'),
-- ('Pintura Acrílica Blanca', 8.00, 'litros', 5, 'Pinturas Express'),
-- ('Cadena para llavero', 0.50, 'unidad', 100, 'Accesorios Import'),
-- ('Chocolate para bombones', 25.00, 'kg', 10, 'Chocolates Premium');

-- INSERT INTO productos (nombre, categoria, precio_venta) VALUES
-- ('Cuadro Personalizado 20x30cm', 'cuadros', 45.00),
-- ('Llavero de Madera', 'llaveros', 8.00),
-- ('Chocobomba Grande', 'chocobombas', 15.00);

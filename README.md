# Sistema de Gestión de Negocio

Sistema completo para gestionar materiales, productos, ventas, gastos e inventario para negocios de manualidades y productos artesanales.

## 🚀 Características

- **Gestión de Materiales**: Registro, control de stock, historial de compras
- **Gestión de Productos**: Creación de productos con materiales y cálculo automático de costos
- **Registro de Ventas**: Control completo de ventas con estados y métodos de pago
- **Reportes y Estadísticas**: Dashboard con gráficos y análisis de ventas
- **Gestión de Gastos**: Control de gastos operativos categorizados
- **Inventario**: Control de stock con alertas y movimientos
- **Gestión de Clientes**: Base de datos de clientes con historial
- **Órdenes Pendientes**: Seguimiento de pedidos por fabricar
- **Calculadoras**: Costo de producción, margen de ganancia, ROI

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- Cuenta en Supabase (https://supabase.com)

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar Supabase:**
   - Crea un proyecto en https://supabase.com
   - Ve a Project Settings > API
   - Copia tu URL y Anon Key
   - Crea un archivo `.env` basado en `.env.example`:
   ```
   VITE_SUPABASE_URL=tu_url_aqui
   VITE_SUPABASE_ANON_KEY=tu_key_aqui
   ```

3. **Ejecutar el esquema de base de datos:**
   - Abre el SQL Editor en Supabase
   - Copia y ejecuta el contenido de `supabase-schema.sql`

4. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

5. **Abrir en el navegador:**
   - Visita http://localhost:5173

## 📦 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI básicos
│   ├── layout/         # Layout y navegación
│   └── ...             # Otros componentes
├── pages/              # Páginas principales
│   ├── Dashboard.tsx
│   ├── Materiales.tsx
│   ├── Productos.tsx
│   ├── Ventas.tsx
│   └── ...
├── lib/                # Utilidades y configuración
│   ├── supabase.ts    # Cliente de Supabase
│   └── utils.ts       # Funciones útiles
├── types/              # Definiciones de TypeScript
├── hooks/              # Custom hooks
└── stores/             # Estado global (Zustand)
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Vista previa de la build
- `npm run lint` - Ejecuta el linter

## 📊 Cálculos Implementados

- **Costo de Producción**: Suma de materiales × cantidades
- **Ganancia por Producto**: Precio venta - Costo producción
- **Margen de Ganancia %**: (Ganancia / Precio venta) × 100
- **ROI**: (Ganancia neta / Inversión total) × 100
- **Punto de Equilibrio**: Calculado automáticamente

## 🎨 Tecnologías Utilizadas

- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Supabase** - Backend y base de datos
- **Recharts** - Gráficos
- **Zustand** - Gestión de estado
- **React Router** - Navegación
- **Lucide React** - Iconos

## 📱 Responsive

El sistema es completamente responsive y funciona en:
- 💻 Desktop
- 📱 Móviles
- 📲 Tablets

## 🔒 Seguridad

- Todas las credenciales en variables de entorno
- Sin datos sensibles en el código
- Validación de datos en cliente y servidor

## 📄 Licencia

Este proyecto es privado y de uso personal.

## 🆘 Soporte

Para problemas o preguntas, consulta la documentación de:
- [Supabase](https://supabase.com/docs)
- [React](https://react.dev)
- [Vite](https://vitejs.dev)

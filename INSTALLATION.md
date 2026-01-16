# Sistema de Gestión - Guía de Instalación

## 🚀 Instalación Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase

#### 2.1. Crear proyecto en Supabase
1. Ve a https://supabase.com
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Completa los datos:
   - Nombre del proyecto
   - Base de datos password (guárdalo)
   - Región (elige la más cercana)

#### 2.2. Obtener credenciales
1. Una vez creado el proyecto, ve a **Settings** (⚙️) > **API**
2. Copia estos dos valores:
   - **Project URL** (URL)
   - **anon public** (API Key)

#### 2.3. Configurar variables de entorno
1. Crea un archivo `.env` en la raíz del proyecto
2. Copia el contenido de `.env.example` y reemplaza con tus valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Ejecutar el esquema de base de datos

1. En Supabase, ve a **SQL Editor** (icono 🗃️)
2. Click en "New query"
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. Copia TODO el contenido
5. Pégalo en el editor SQL de Supabase
6. Click en **Run** (o presiona Ctrl/Cmd + Enter)
7. Espera a que se ejecute (verás "Success" cuando termine)

### 4. Iniciar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

## 📝 Verificación

Para verificar que todo está funcionando:

1. Abre http://localhost:5173
2. Deberías ver el Dashboard
3. Intenta crear un material en la sección "Materiales"
4. Si todo funciona, ¡estás listo!

## ⚠️ Solución de Problemas

### Error: "Faltan las credenciales de Supabase"
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables empiezan con `VITE_`
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error al conectar con Supabase
- Verifica que copiaste correctamente la URL y la API Key
- Verifica que el proyecto de Supabase está activo
- Verifica tu conexión a internet

### Error al ejecutar el esquema SQL
- Verifica que copiaste TODO el archivo `supabase-schema.sql`
- Si hay errores, ejecútalo por secciones
- Puedes borrar las tablas y volver a ejecutar

## 📱 Uso de la Aplicación

### Flujo recomendado:

1. **Materiales**: Registra todos tus materiales e insumos
2. **Productos**: Crea productos y asigna los materiales que usan
3. **Ventas**: Registra las ventas de tus productos
4. **Dashboard**: Visualiza tus estadísticas y gráficos

## 🔒 Seguridad

- Nunca compartas tu archivo `.env`
- Nunca subas el archivo `.env` a GitHub
- La API Key "anon" es pública, pero solo permite operaciones permitidas por RLS

## 📚 Más Información

- Documentación de Supabase: https://supabase.com/docs
- Documentación de React: https://react.dev
- Documentación de Vite: https://vitejs.dev

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa la terminal donde corre el servidor
3. Verifica los logs en Supabase (Logs > Postgres Logs)

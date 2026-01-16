# 🚀 INICIO RÁPIDO - Sistema de Gestión

## Comandos para empezar

### 1️⃣ Instalar dependencias (ejecutar primero)
npm install

### 2️⃣ Configurar Supabase
# Antes de ejecutar el proyecto, necesitas:
# 1. Crear cuenta en https://supabase.com
# 2. Crear un proyecto nuevo
# 3. Ir a Settings > API y copiar:
#    - Project URL
#    - anon public key
# 4. Crear archivo .env con este contenido:

VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui

### 3️⃣ Ejecutar el esquema SQL
# 1. Abre Supabase > SQL Editor
# 2. Copia TODO el contenido de supabase-schema.sql
# 3. Pégalo y ejecuta (Run)
# 4. Espera a que termine (verás "Success")

### 4️⃣ Iniciar el proyecto
npm run dev

# ¡Listo! Abre http://localhost:5173 en tu navegador

## 📝 Otros comandos útiles

# Construir para producción
npm run build

# Vista previa de la build
npm run preview

# Ejecutar linter
npm run lint

## 🆘 ¿Problemas?

### Error "Cannot find module"
npm install

### Error "Faltan credenciales de Supabase"
# Verifica que existe el archivo .env en la raíz
# Verifica que tiene las variables correctas
# Reinicia el servidor (Ctrl+C y npm run dev)

### La página está en blanco
# Abre la consola del navegador (F12)
# Mira si hay errores
# Verifica que Supabase está configurado

### No se conecta a Supabase
# Verifica tu conexión a internet
# Verifica que las credenciales son correctas
# Verifica que el proyecto de Supabase está activo

## 📚 Documentación

- README.md - Información general del proyecto
- INSTALLATION.md - Guía detallada de instalación
- COMPLETADO.md - Lista completa de funcionalidades

## ✅ Checklist de Instalación

- [ ] npm install ejecutado
- [ ] Cuenta de Supabase creada
- [ ] Proyecto de Supabase creado
- [ ] Archivo .env creado con credenciales
- [ ] Esquema SQL ejecutado en Supabase
- [ ] npm run dev ejecutado
- [ ] Aplicación abierta en navegador
- [ ] Primer material creado exitosamente

¡Una vez completados todos los pasos, estás listo para usar el sistema! 🎉

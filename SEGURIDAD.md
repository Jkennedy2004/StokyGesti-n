# 🔐 Configuración de Seguridad - Sistema de Gestión

## 📋 Pasos para Configurar la Autenticación

### 1. Habilitar Autenticación en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Authentication** > **Providers**
3. Asegúrate de que **Email** esté habilitado
4. Configura las opciones:
   - ✅ Enable Email provider
   - ✅ Confirm email (opcional, desactívalo para desarrollo)
   - ⚙️ Configura el SMTP si quieres emails reales (opcional)

### 2. Aplicar Políticas de Seguridad (RLS)

1. Ve a **SQL Editor** en Supabase
2. Ejecuta el archivo `supabase-security.sql` completo
3. Esto habilitará Row Level Security y creará las políticas

### 3. Crear el Primer Usuario

**Opción A - Desde el Dashboard:**
1. Ve a **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Ingresa:
   - Email: `admin@sistema.com`
   - Password: `admin123456`
4. Click en **Create user**

**Opción B - Desde la aplicación:**
1. Inicia la aplicación
2. Ve a `/login`
3. Click en "¿No tienes cuenta? Regístrate"
4. Completa el formulario
5. Si tienes confirmación de email desactivada, podrás iniciar sesión inmediatamente

### 4. Verificar Configuración

Ejecuta este SQL para verificar que RLS está activo:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;
```

Deberías ver todas tus tablas con `rowsecurity = true`.

## 🔑 Características de Seguridad Implementadas

### ✅ Autenticación
- Login con email y contraseña
- Registro de nuevos usuarios
- Gestión de sesión persistente
- Auto-redirect si no está autenticado

### ✅ Protección de Rutas
- Todas las rutas están protegidas excepto `/login`
- Redirección automática a login si no hay sesión
- Loading state mientras verifica autenticación

### ✅ Row Level Security (RLS)
- Todas las tablas protegidas con RLS
- Solo usuarios autenticados pueden acceder a datos
- Políticas separadas para SELECT, INSERT, UPDATE, DELETE

### ✅ UI de Seguridad
- Página de login profesional
- Mostrar email del usuario en sidebar
- Botón de cerrar sesión
- Mensajes de error claros

## 🎯 Próximos Pasos Opcionales

### Roles y Permisos
Si quieres agregar roles (admin, usuario, etc.):

```sql
-- Agregar columna de rol a auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@sistema.com';

-- Crear políticas basadas en roles
CREATE POLICY "Solo admins pueden eliminar"
  ON ventas FOR DELETE
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt()->>'user_metadata'->>'role') = 'admin'
  );
```

### Confirmación de Email
Para habilitar confirmación de email:
1. Ve a **Authentication** > **Email Templates**
2. Personaliza el template de confirmación
3. Configura SMTP en **Settings** > **Project Settings** > **Email**
4. Habilita "Confirm email" en Email Auth settings

### Recuperación de Contraseña
Ya está configurado por defecto. Para usarlo:
1. En la página de login, agrega un link "¿Olvidaste tu contraseña?"
2. Usa `supabase.auth.resetPasswordForEmail(email)`
3. El usuario recibirá un email con link de recuperación

### Autenticación con OAuth
Supabase soporta Google, GitHub, etc.:
1. Ve a **Authentication** > **Providers**
2. Habilita el provider deseado
3. Configura las credenciales OAuth
4. Usa `supabase.auth.signInWithOAuth({ provider: 'google' })`

## 🚀 Uso en la Aplicación

### Iniciar Sesión
```typescript
const { signIn } = useAuth()
const { error } = await signIn(email, password)
```

### Obtener Usuario Actual
```typescript
const { user } = useAuth()
console.log(user.email)
```

### Cerrar Sesión
```typescript
const { signOut } = useAuth()
await signOut()
```

### Verificar Autenticación
```typescript
const { user, loading } = useAuth()

if (loading) return <Loading />
if (!user) return <Navigate to="/login" />
```

## 🔒 Mejores Prácticas de Seguridad

1. **Nunca expongas las API keys del cliente** - Ya están en variables de entorno
2. **Usa HTTPS en producción** - Supabase lo hace automáticamente
3. **Configura políticas RLS específicas** - No confíes solo en el frontend
4. **Implementa rate limiting** - Para prevenir ataques de fuerza bruta
5. **Audita accesos** - Revisa los logs en Supabase Dashboard
6. **Usa contraseñas fuertes** - Mínimo 8 caracteres
7. **Habilita 2FA** - Para cuentas de administrador

## 📝 Credenciales de Demo

Para desarrollo y pruebas:
- **Email:** demo@sistema.com
- **Password:** demo123

**⚠️ IMPORTANTE:** Elimina estas credenciales en producción.

## 🐛 Solución de Problemas

### "Invalid API key"
- Verifica que las variables de entorno en `.env` sean correctas
- Asegúrate de reiniciar el servidor después de cambiar `.env`

### "JWT expired"
- La sesión expiró, el usuario será redirigido a login automáticamente
- Configura el tiempo de expiración en Supabase Dashboard

### "Row Level Security Policy violation"
- Verifica que ejecutaste el script `supabase-security.sql`
- Confirma que el usuario está autenticado
- Revisa los logs de Supabase para ver qué política falló

### Usuario no puede registrarse
- Verifica que Email Auth esté habilitado
- Si tienes "Confirm email" activado, el usuario debe verificar su email primero
- Revisa si hay restricciones de dominio configuradas

## 📚 Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Políticas de Seguridad](https://supabase.com/docs/guides/database/postgres/row-level-security)

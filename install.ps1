# Script de Instalación - Sistema de Gestión
# Ejecutar en PowerShell en la carpeta del proyecto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SISTEMA DE GESTIÓN - INSTALACIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: No se encuentra package.json" -ForegroundColor Red
    Write-Host "Por favor ejecuta este script desde la carpeta del proyecto" -ForegroundColor Yellow
    exit
}

Write-Host "✓ Carpeta del proyecto verificada" -ForegroundColor Green
Write-Host ""

# Paso 1: Instalar dependencias
Write-Host "📦 Paso 1: Instalando dependencias..." -ForegroundColor Yellow
Write-Host "Esto puede tomar unos minutos..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    Write-Host "Por favor verifica tu conexión a internet e intenta de nuevo" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Paso 2: Verificar archivo .env
Write-Host "🔑 Paso 2: Verificando configuración..." -ForegroundColor Yellow

if (!(Test-Path ".env")) {
    Write-Host "⚠️  No se encuentra el archivo .env" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Necesitas crear un archivo .env con tus credenciales de Supabase:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "VITE_SUPABASE_URL=tu_url_aqui" -ForegroundColor White
    Write-Host "VITE_SUPABASE_ANON_KEY=tu_key_aqui" -ForegroundColor White
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Cyan
    Write-Host "1. Ve a https://supabase.com y crea un proyecto" -ForegroundColor White
    Write-Host "2. Copia la URL y API Key desde Settings > API" -ForegroundColor White
    Write-Host "3. Crea el archivo .env en la raíz del proyecto" -ForegroundColor White
    Write-Host "4. Ejecuta el esquema SQL (supabase-schema.sql)" -ForegroundColor White
    Write-Host ""
    
    $crear = Read-Host "¿Quieres crear el archivo .env ahora? (s/n)"
    if ($crear -eq "s" -or $crear -eq "S") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Archivo .env creado desde .env.example" -ForegroundColor Green
        Write-Host "Por favor edítalo y agrega tus credenciales de Supabase" -ForegroundColor Yellow
        notepad .env
    }
} else {
    Write-Host "✓ Archivo .env encontrado" -ForegroundColor Green
}

Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE INSTALACIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configura Supabase:" -ForegroundColor White
Write-Host "   - Crea proyecto en https://supabase.com" -ForegroundColor Gray
Write-Host "   - Copia credenciales al archivo .env" -ForegroundColor Gray
Write-Host "   - Ejecuta supabase-schema.sql en SQL Editor" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Inicia el proyecto:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Abre en el navegador:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentación completa en:" -ForegroundColor Yellow
Write-Host "   - INSTALLATION.md (guía detallada)" -ForegroundColor Gray
Write-Host "   - INICIO-RAPIDO.md (comandos rápidos)" -ForegroundColor Gray
Write-Host "   - ESTRUCTURA.md (estructura del proyecto)" -ForegroundColor Gray
Write-Host ""
Write-Host "¡Listo! Ahora configura Supabase y ejecuta 'npm run dev' 🚀" -ForegroundColor Green
Write-Host ""

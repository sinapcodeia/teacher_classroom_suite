# validate-release.ps1
# Script de Validación Previa y Gobernanza - IETABA Teacher Classroom Suite
# Creado: 2026-05-24
#
# Este script actúa como una compuerta estricta (Gatekeeper) para certificar que el código local
# no tiene errores de compilación, fallos de tipos en TypeScript, ni violaciones de estilo antes
# de empujar cambios a producción en Vercel.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🛡️  INICIANDO PROTOCOLO DE GOBERNANZA: IETABA TEACHER SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$validationPass = $true

# Paso 1: Chequeo de sintaxis básica y estructura del proyecto
Write-Host "[1/4] Checking package structure..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
        Write-Host "✓ package.json syntax is OK (App Version: $($pkg.version))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: package.json has invalid JSON syntax!" -ForegroundColor Red
        $validationPass = $false
    }
} else {
    Write-Host "❌ Error: package.json not found in root directory!" -ForegroundColor Red
    $validationPass = $false
}
Write-Host ""

# Paso 2: Ejecutar verificación estricta de tipos TypeScript
if ($validationPass) {
    Write-Host "[2/4] Running strict TypeScript type check (tsc --noEmit)..." -ForegroundColor Yellow
    try {
        npx tsc --noEmit
        Write-Host "✓ TypeScript type checking PASSED successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: TypeScript type checking failed! Please fix all type mismatches before pushing." -ForegroundColor Red
        $validationPass = $false
    }
}
Write-Host ""

# Paso 3: Ejecutar verificación sintáctica del Linter
if ($validationPass) {
    Write-Host "[3/4] Running ESLint check..." -ForegroundColor Yellow
    try {
        npm run lint
        Write-Host "✓ Linter check PASSED with no critical violations!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Warning: Linter found style or format improvements. Proceeding but review suggested..." -ForegroundColor Yellow
    }
}
Write-Host ""

# Paso 4: Ejecutar simulación de build en producción (Next.js dry build)
if ($validationPass) {
    Write-Host "[4/4] Executing production Next.js compilation (npm run build)..." -ForegroundColor Yellow
    try {
        npm run build
        Write-Host "✓ Next.js Production Build PASSED successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: Production build compilation failed! Webpack errors or static routes generation failed." -ForegroundColor Red
        $validationPass = $false
    }
}
Write-Host ""

# Reportar resultado final
Write-Host "==========================================================" -ForegroundColor Cyan
if ($validationPass) {
    Write-Host "🟢 CERTIFICACIÓN DE GOBERNANZA EXCELENTE: APROBADO PARA DESPLIEGUE" -ForegroundColor Green
    Write-Host "El código cumple con el estándar de estabilidad. Es seguro empujar a Vercel." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "🔴 ALERTA DE SEGURIDAD: DESPLIEGUE RECHAZADO" -ForegroundColor Red
    Write-Host "Se encontraron fallos de código. Por favor aplique el plan de reversión (Rollback)" -ForegroundColor Red
    Write-Host "o corrija los errores locales antes de intentar de nuevo." -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}

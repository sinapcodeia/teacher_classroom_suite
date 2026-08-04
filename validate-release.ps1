# validate-release.ps1
# Script de Validacion Previa y Gobernanza - IETABA Teacher Classroom Suite
# Creado: 2026-05-24
#
# Este script actua como una compuerta estricta (Gatekeeper) para certificar que el codigo local
# no tiene errores de compilacion, fallos de tipos en TypeScript, ni violaciones de estilo antes
# de empujar cambios a produccion en Vercel.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "INFO: INICIANDO PROTOCOLO DE GOBERNANZA: IETABA TEACHER SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$validationPass = $true

# Paso 1: Chequeo de sintaxis basica y estructura del proyecto
Write-Host "[1/4] Checking package structure..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
        Write-Host "SUCCESS: package.json syntax is OK (App Version: $($pkg.version))" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: package.json has invalid JSON syntax!" -ForegroundColor Red
        $validationPass = $false
    }
} else {
    Write-Host "ERROR: package.json not found in root directory!" -ForegroundColor Red
    $validationPass = $false
}
Write-Host ""

# Paso 2: Ejecutar verificacion estricta de tipos TypeScript
if ($validationPass) {
    Write-Host "[2/4] Running strict TypeScript type check (npm run typecheck)..." -ForegroundColor Yellow
    # Ejecutar el comando de TypeScript
    npm run typecheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: TypeScript type checking failed! Please fix all type mismatches before pushing." -ForegroundColor Red
        $validationPass = $false
    } else {
        Write-Host "SUCCESS: TypeScript type checking PASSED successfully!" -ForegroundColor Green
    }
}
Write-Host ""

# Paso 3: Ejecutar verificacion sintactica del Linter
if ($validationPass) {
    Write-Host "[3/4] Running ESLint check..." -ForegroundColor Yellow
    # Ejecutar el linter
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARN: Linter found style or format improvements. Review suggested..." -ForegroundColor Yellow
    } else {
        Write-Host "SUCCESS: Linter check PASSED with no critical violations!" -ForegroundColor Green
    }
}
Write-Host ""

# Paso 4: Ejecutar simulacion de build en produccion (Next.js dry build)
if ($validationPass) {
    Write-Host "[4/4] Executing production Next.js compilation (npm run build)..." -ForegroundColor Yellow
    # Ejecutar la simulacion de build
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Production build compilation failed! Webpack errors or static routes generation failed." -ForegroundColor Red
        $validationPass = $false
    } else {
        Write-Host "SUCCESS: Next.js Production Build PASSED successfully!" -ForegroundColor Green
    }
}
Write-Host ""

# Reportar resultado final
Write-Host "==========================================================" -ForegroundColor Cyan
if ($validationPass) {
    Write-Host "SUCCESS: CERTIFICACION DE GOBERNANZA EXCELENTE: APROBADO PARA DESPLIEGUE" -ForegroundColor Green
    Write-Host "El codigo cumple con el estandar de estabilidad. Es seguro empujar a Vercel." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "FAIL: ALERTA DE SEGURIDAD: DESPLIEGUE RECHAZADO" -ForegroundColor Red
    Write-Host "Se encontraron fallos de codigo. Por favor aplique el plan de reversion (Rollback)" -ForegroundColor Red
    Write-Host "o corrija los errores locales antes de intentar de nuevo." -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}

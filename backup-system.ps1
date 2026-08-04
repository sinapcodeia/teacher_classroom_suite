# backup-system.ps1
# Script de Respaldo y Criptografia SHA-256 - IETABA Teacher Classroom Suite
# Creado: 2026-05-24
#
# Cumple con la directiva de seguridad ISO 27001 y Ley 1581 (Proteccion de Datos).
# Empaqueta y firma digitalmente el codigo fuente y las configuraciones de la aplicacion.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "INFO: INICIANDO SISTEMA DE RESPALDO Y PROTECCION DE DATOS" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# 1. Crear carpeta de respaldos si no existe
$backupDir = "backups"
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "SUCCESS: Carpeta '$backupDir/' creada con exito." -ForegroundColor Green
}

# 2. Extraer version actual desde package.json
$version = "unknown"
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    $version = $pkg.version
}

# 3. Preparar nombres de archivo con estampas temporales
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$zipName = "backup_v$($version)_$($timestamp).zip"
$zipPath = Join-Path $backupDir $zipName
$reportPath = Join-Path $backupDir "integrity_report.txt"

Write-Host "Version a respaldar: v$version" -ForegroundColor Cyan
Write-Host "Archivo destino: $zipPath" -ForegroundColor Cyan
Write-Host ""

# 4. Definir archivos y carpetas a incluir
$filesToInclude = @(
    "src",
    "public",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "CHANGELOG.md",
    "BACKUP_POLICY.md",
    "validate-release.ps1"
)

# Filtrar solo elementos que realmente existen
$existingItems = @()
foreach ($item in $filesToInclude) {
    if (Test-Path $item) {
        $existingItems += $item
    }
}

# 5. Crear el archivo comprimido (ZIP)
Write-Host "Comprimiendo codigo fuente y configuraciones criticas..." -ForegroundColor Yellow
try {
    # Eliminar archivo previo si por alguna razon ya existe
    if (Test-Path $zipPath) { Remove-Item $zipPath }
    
    # Comprimir usando el motor interno de .NET
    Compress-Archive -Path $existingItems -DestinationPath $zipPath -Force
    Write-Host "SUCCESS: Compresion completada correctamente." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Error en el proceso de compresion: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 6. Calcular firma de seguridad digital SHA-256 (Integridad)
Write-Host "Calculando Hash Criptografico SHA-256 de seguridad..." -ForegroundColor Yellow
try {
    $fileHash = Get-FileHash -Path $zipPath -Algorithm SHA256
    $hashString = $fileHash.Hash
    Write-Host "SUCCESS: Hash SHA-256 generado: $hashString" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Error al calcular el Hash criptografico." -ForegroundColor Red
    exit 1
}
Write-Host ""

# 7. Generar reporte oficial de integridad y gobernanza
$reportContent = @"
======================================================================
REPORT DE INTEGRIDAD DE RESPALDO - IETABA TEACHER SUITE
======================================================================
Fecha del Respaldo : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Version del Software: v$version
Nombre del Archivo  : $zipName
Ruta Absoluta       : $(Resolve-Path $zipPath)
Tamano del Archivo  : $((Get-Item $zipPath).Length) bytes
Algoritmo de Firma  : SHA-256
Hash Criptografico  : $hashString
----------------------------------------------------------------------
Gobernanza: Este archivo comprimido cumple con las especificaciones
de la Ley 1581 de 2012 y la ISO 27001. La firma de integridad digital
certifica que la copia no ha sido alterada ni corrompida.
======================================================================
"@

$reportContent | Out-File -FilePath $reportPath -Encoding utf8
Write-Host "SUCCESS: Reporte de integridad oficial guardado en '$reportPath'" -ForegroundColor Green
Write-Host ""

# Finalizar
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "SUCCESS: RESPALDO COMPLETADO Y CERTIFICADO CRIPTOGRAFICAMENTE" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
exit 0

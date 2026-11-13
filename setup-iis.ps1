# ==============================================================================
# Script de Configuración e Instalación de Bola de Nieve en IIS
# ==============================================================================
param(
    [int]$Port = 8083,
    [string]$SiteName = "BolaDeNieve",
    [string]$AppPoolName = "BolaDeNievePool",
    [string]$PhysicalPath = "D:\Proyectos\Bola de nieve"
)

# Verificar privilegios de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse con privilegios de Administrador." -ForegroundColor Red
    Write-Host "Por favor, ejecute setup-iis.bat como Administrador." -ForegroundColor Yellow
    exit 1
}

Import-Module WebAdministration -ErrorAction SilentlyContinue

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Instalando Bola de Nieve en IIS (Puerto: $Port)               " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Configurar Application Pool
Write-Host "1. Configurando Application Pool '$AppPoolName'..." -ForegroundColor Yellow
if (!(Test-Path "IIS:\AppPools\$AppPoolName")) {
    New-Item "IIS:\AppPools\$AppPoolName" | Out-Null
    Write-Host "   -> AppPool '$AppPoolName' creado." -ForegroundColor Green
} else {
    Write-Host "   -> AppPool '$AppPoolName' ya existe, actualizando..." -ForegroundColor Gray
}

Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "managedPipelineMode" -Value "Integrated"
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "startMode" -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "processModel.idleTimeout" -Value "00:00:00"

# 2. Configurar Permisos de Carpeta
Write-Host "2. Asignando permisos en '$PhysicalPath'..." -ForegroundColor Yellow
$appPoolIdentity = "IIS AppPool\" + $AppPoolName
icacls "$PhysicalPath" /grant "IIS_IUSRS:(OI)(CI)RX" /grant "IUSR:(OI)(CI)RX" /grant "${appPoolIdentity}:(OI)(CI)F" /t /q | Out-Null
if (Test-Path "$PhysicalPath\logs") {
    icacls "$PhysicalPath\logs" /grant "${appPoolIdentity}:(OI)(CI)F" /t /q | Out-Null
}
Write-Host "   -> Permisos asignados correctamente." -ForegroundColor Green

# 3. Configurar Sitio Web en IIS
Write-Host "3. Creando Sitio Web '$SiteName' en puerto $Port..." -ForegroundColor Yellow
if (Test-Path "IIS:\Sites\$SiteName") {
    Write-Host "   -> Deteniendo y actualizando sitio existente '$SiteName'..." -ForegroundColor Gray
    Stop-Website -Name $SiteName -ErrorAction SilentlyContinue
    Remove-Website -Name $SiteName
}

New-Website -Name $SiteName -Port $Port -PhysicalPath $PhysicalPath -ApplicationPool $AppPoolName | Out-Null
Start-Website -Name $SiteName -ErrorAction SilentlyContinue

# 4. Habilitar regla en el Firewall de Windows para acceso desde celular / red WiFi
Write-Host "4. Configurando regla de Firewall para puerto $Port..." -ForegroundColor Yellow
try {
    netsh advfirewall firewall delete rule name="BolaDeNieve (Puerto $Port)" | Out-Null
    netsh advfirewall firewall add rule name="BolaDeNieve (Puerto $Port)" dir=in action=allow protocol=TCP localport=$Port profile=any | Out-Null
    Write-Host "   -> Puerto $Port habilitado en Firewall de Windows (Dominio, Privada y Publica)." -ForegroundColor Green
} catch {
    Write-Host "   -> Aviso Firewall: $($_.Exception.Message)" -ForegroundColor Gray
}

# Obtener IP local
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  ¡BOLA DE NIEVE AGREGADO CON ÉXITO EN IIS EN PUERTO $Port!       " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acceso local en esta máquina:    http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Acceso desde celular en tu WiFi:  http://${localIp}:$Port" -ForegroundColor Cyan
Write-Host "Base de Datos SQL Server:        localhost\SQLEXPRESS (BolaDeNieve)" -ForegroundColor Yellow
Write-Host "Cloudflare Tunnel:               Apuntar hostname a http://localhost:$Port" -ForegroundColor Magenta
Write-Host ""
Write-Host "Abriendo en el navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:$Port"

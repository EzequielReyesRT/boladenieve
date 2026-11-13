@echo off
setlocal
cd /d "%~dp0"

:: Verificar si se ejecuta como Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ELEVANDO PRIVILEGIOS] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

title Habilitar Firewall - Bola de Nieve (Puerto 8083)
cls
echo ==============================================================================
echo   Habilitando Regla de Firewall para Bola de Nieve (Puerto 8083)
echo ==============================================================================
echo.

netsh advfirewall firewall delete rule name="BolaDeNieve (Puerto 8083)" >nul 2>&1
netsh advfirewall firewall add rule name="BolaDeNieve (Puerto 8083)" dir=in action=allow protocol=TCP localport=8083 profile=any

echo.
echo ==============================================================================
echo   Regla creada con exito. Ahora puedes acceder desde tu celular en tu WiFi.
echo ==============================================================================
echo.
pause

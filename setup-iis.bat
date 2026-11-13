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

title Configuracion IIS - Bola de Nieve (Puerto 8083)
cls
powershell -ExecutionPolicy Bypass -File "%~dp0setup-iis.ps1"
echo.
echo Presiona cualquier tecla para salir...
pause >nul

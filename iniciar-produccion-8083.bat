@echo off
setlocal
cd /d "%~dp0"
title Servidor Bola de Nieve (Produccion) - Puerto 8083

echo ==============================================================================
echo   Iniciando Bola de Nieve en Modo Produccion (Puerto 8083)
echo ==============================================================================
echo.

:: Verificar que exista la compilacion de produccion
if not exist ".next" (
    echo Compilando aplicacion para produccion...
    call npm run build
)

set PORT=8083
set HOSTNAME=0.0.0.0

echo.
echo Servidor listo y escuchando en:
echo   - Local:    http://localhost:8083
echo   - Red WiFi: http://0.0.0.0:8083
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.

call npx next start -p 8083 -H 0.0.0.0
pause

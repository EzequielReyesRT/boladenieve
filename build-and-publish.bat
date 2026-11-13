@echo off
setlocal
cd /d "%~dp0"

echo ==============================================================================
echo Compilando y Publicando Bola de Nieve para Produccion (Puerto 8083)
echo ==============================================================================
echo.

echo [1/3] Generando respaldo y exportacion de base de datos...
call npm run db:export

echo.
echo [2/3] Compilando aplicacion Next.js en Modo Produccion...
call npm run build
if %errorlevel% neq 0 (
    echo Error al compilar aplicacion.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Permisos y verificacion completada.
echo ==============================================================================
echo Compilacion exitosa. Ejecuta 'iniciar-produccion-8083.bat' o usa IIS.
echo ==============================================================================
pause

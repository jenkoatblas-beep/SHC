@echo off
chcp 65001 >nul
setlocal EnableExtensions

rem =============================================================================
rem  MySQL 8 (servicio MySQL80): deja usuario ROOT con contraseña ROOT
rem  Clic derecho > Ejecutar como administrador
rem  Rutas por defecto instalacion oficial Oracle. Ajuste MYSQLD/MYINI si hace falta.
rem =============================================================================

set "MYSQLD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
set "MYSQL=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set "MYINI=C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
set "SQLFILE=%~dp0sql\mysql-set-root-password.sql"

echo.
echo === Configurar MySQL: usuario root, contrasena root ===
echo Debe ejecutarse como Administrador de Windows.
echo.

if not exist "%MYSQLD%" (
  echo ERROR: No se encuentra mysqld.exe en:
  echo   %MYSQLD%
  echo Edite este .cmd y ponga la ruta correcta de su instalacion.
  pause
  exit /b 1
)

if not exist "%SQLFILE%" (
  echo ERROR: No se encuentra el archivo SQL:
  echo   %SQLFILE%
  pause
  exit /b 1
)

net stop MySQL80 >nul 2>&1

taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo Arrancando mysqld temporal con --skip-grant-tables...
start "mysql-skip-grant" /MIN "" "%MYSQLD%" --defaults-file="%MYINI%" --skip-grant-tables

echo Esperando arranque (30 s)...
timeout /t 30 /nobreak >nul

echo Aplicando cambio de contrasena (root / root)...
"%MYSQL%" --protocol=TCP -h 127.0.0.1 -P 3306 -u root < "%SQLFILE%"
if errorlevel 1 (
  echo Reintentando conexion por localhost...
  "%MYSQL%" --protocol=TCP -h localhost -P 3306 -u root < "%SQLFILE%"
)

echo Cerrando instancia temporal de mysqld...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 5 /nobreak >nul

echo Iniciando servicio MySQL80...
net start MySQL80
if errorlevel 1 (
  echo ERROR: No se pudo iniciar MySQL80. Compruebe que ejecuto como Administrador.
  pause
  exit /b 1
)

echo.
echo Listo.
echo   Usuario:  root
echo   Contrasena: root
echo.
echo En Workbench o en server/.env puede usar MYSQL_USER=root y MYSQL_PASSWORD=root
echo.
pause

@echo off
chcp 65001 >nul
setlocal EnableExtensions

set "MYSQLD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
set "MYSQL=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set "MYINI=C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
set "SQLFILE=%~dp0sql\mysql-set-root-password.sql"

echo.
echo === MySQL: usuario root, contraseña root ===
echo Ejecutar como Administrador (clic derecho en este archivo).
echo.

net stop MySQL80 >nul 2>&1

if not exist "%SQLFILE%" (
  echo ERROR: Falta %SQLFILE%
  pause
  exit /b 1
)

taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo Arrancando mysqld temporal (skip-grant-tables)...
start "mysql-skip-grant" /MIN "" "%MYSQLD%" --defaults-file="%MYINI%" --skip-grant-tables

echo Esperando arranque (30 s)...
timeout /t 30 /nobreak >nul

echo Aplicando SQL (cambia contraseña y apaga la instancia temporal)...
"%MYSQL%" --protocol=TCP -h 127.0.0.1 -P 3306 -u root < "%SQLFILE%"
if errorlevel 1 (
  echo Reintentando por localhost TCP...
  "%MYSQL%" --protocol=TCP -h localhost -P 3306 -u root < "%SQLFILE%"
)

echo Cerrando cualquier mysqld residual...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 5 /nobreak >nul

echo Iniciando servicio Windows MySQL80...
net start MySQL80
if errorlevel 1 (
  echo ERROR: No arranco MySQL80. Ejecuta este archivo como Administrador.
  pause
  exit /b 1
)

echo.
echo Listo. Usuario: root   Contrasena: root
echo Si Workbench no conecta, cierra Workbench y vuelve a abrirlo.
echo.
pause

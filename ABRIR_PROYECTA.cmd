@echo off
title PROYECTA - Reconstruir Aurora
echo Abriendo PROYECTA. Espera unos segundos...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\abrir-proyecta.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo abrir PROYECTA. Revisa el mensaje anterior.
  pause
)

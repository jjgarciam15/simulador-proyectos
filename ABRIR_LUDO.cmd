@echo off
title Ludo - Reconstruir el Reino de Liones
echo Abriendo Ludo. Espera unos segundos...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\abrir-ludo.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo abrir Ludo. Revisa el mensaje anterior.
  pause
)

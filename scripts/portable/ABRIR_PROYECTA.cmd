@echo off
title PROYECTA - Simulador de proyectos (portatil)
echo Abriendo PROYECTA. No cierres esta ventana mientras usas el simulador.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-portatil.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo abrir PROYECTA. Revisa el mensaje anterior.
  pause
)

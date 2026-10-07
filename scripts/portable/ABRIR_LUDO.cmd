@echo off
title Ludo - Simulador de proyectos (portatil)
echo Abriendo Ludo. No cierres esta ventana mientras usas el simulador.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-portatil.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo abrir Ludo. Revisa el mensaje anterior.
  pause
)

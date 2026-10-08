# Abrir Ludo

Haz doble clic en **ABRIR_LUDO.cmd**, en esta carpeta.

El acceso inicia el simulador y lo abre en una ventana de Microsoft Edge con apariencia de aplicación. Si Edge no está instalado, utiliza el navegador predeterminado. No necesitas abrir una terminal ni iniciar el servidor manualmente.

- Espera unos segundos durante el primer inicio.
- Si el simulador ya está funcionando, reutiliza el servidor existente.
- Puedes crear un acceso directo a `ABRIR_LUDO.cmd` en el escritorio.
- Las mejoras aparecen al actualizar la ventana. Confirma primero las decisiones pendientes.
- Las partidas se guardan en el navegador. Usa siempre el mismo navegador y perfil: la vista de Codex y Edge tienen guardados independientes.
- Cerrar la ventana conserva tu partida. El servidor local queda disponible hasta cerrar Windows; no publica nada en Internet.

Dirección local: http://127.0.0.1:5173/

## Si cambias de equipo

Instala Node.js 24 LTS y pnpm. Desde esta carpeta, ejecuta `pnpm install` una vez. Después utiliza el archivo de acceso.

Si no inicia, el acceso muestra el error y mantiene la ventana abierta. Los registros del servidor están en `.local/servidor.log` y `.local/servidor-error.log`.

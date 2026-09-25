# Seguridad y privacidad

PROYECTA guarda partidas únicamente en el navegador. No necesita claves API ni cuenta. Los enlaces a fuentes oficiales se abren por decisión del usuario. No introduzcas nombres reales de estudiantes ni información sensible en las justificaciones de una partida que vayas a compartir.

Para reportar una vulnerabilidad, usa un canal privado con la persona responsable del repositorio; si GitHub muestra la opción de reporte privado en Security, utilízala. No publiques credenciales ni datos de partidas en una incidencia. No se define aquí un correo o canal que todavía no exista.

`pnpm repo:check` detecta algunos patrones de secretos y archivos locales preparados para Git; no detecta todas las posibles filtraciones. `.env`, registros, exportaciones locales, dependencias y compilaciones están excluidos de Git. El flujo de CI solo requiere lectura del contenido y no despliega la aplicación.

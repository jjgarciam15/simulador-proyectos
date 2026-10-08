# Actualización V2 · 23 de septiembre de 2026

- Presupuesto detallado guardado e incluido en el informe.
- 36 condiciones de negociación propias de las nueve misiones.
- Cinco nuevos ejercicios MGA/económicos con explicación por error.
- Regresión de todas las misiones y dificultades.
- Carpeta preparada para GitHub: ver `docs/GUIA_GITHUB.md`.

# Reino de Liones: expansión de reconstrucción

## Cómo probarla

Abre `ABRIR_LUDO.cmd`. Si ya tienes la ventana abierta, confirma tus cambios pendientes y actualiza la página.

El mapa permite seleccionar un distrito y recibir su misión. También puedes usar las tarjetas de proyectos. Hay nueve misiones, cada una con ocho etapas y cuatro alternativas.

## Nuevos proyectos

- **Energía — Cumbres del Sol:** central térmica, microredes solares, reparación y eficiencia, o sistema híbrido con respaldo.
- **Alimentos — Huertas del Renacer:** cultivo intensivo, invernaderos, almacenamiento y frío, o agroecología con acopio.
- **Vivienda — Barrio Horizonte:** ciudadela nueva, rehabilitación, vivienda progresiva, o rehabilitación con módulos.

Cada proyecto incluye presupuesto, actores, estudios, cadena causal, riesgos, regulación, flujos y contribuciones ODS. Los datos son simulados.

## Situaciones y decisiones

Las partidas nuevas incorporan cuatro situaciones adicionales: convoyes desviados, brigadas comunitarias, repuestos recuperados y solicitudes de asentamientos vecinos. Cada escenario tiene ocho eventos posibles; no todos aparecerán en una partida. Los estudios, el apoyo y las mitigaciones influyen en la exposición. La semilla mantiene los sorteos reproducibles.

Seleccionar una respuesta muestra sus consecuencias sin gastar: costo, retraso, desempeño y apoyo. **Confirmar respuesta** aplica la decisión. Las respuestas sin financiación muestran el motivo del bloqueo.

## Movimiento y navegación

- Mapa ilustrado con nueve puntos seleccionables mediante toque, ratón o teclado.
- Escena de ejecución con cambios de color, luz y ambiente según el avance.
- Transiciones en tarjetas, respuestas y progreso.
- Respeto de la preferencia del sistema de reducir movimiento.

La escena es una ilustración ambiental animada, no una representación física de las obras. Los indicadores del simulador muestran los resultados calculados.

## Guardados y validación

Se conserva la compatibilidad con las partidas anteriores: no se les introducen los cuatro eventos nuevos. Para probar toda la expansión, inicia una misión nueva. El avance nacional ahora se calcula sobre nueve servicios; por eso un historial previo puede mostrar un porcentaje menor sin perder sus resultados.

Validación: 31 pruebas automatizadas, incluyendo cierre reproducible de los nueve escenarios, integridad de presupuesto, consulta de respuestas sin mutación y compatibilidad con contenido anterior. Comprobados el mapa y la selección de la misión de energía en el navegador. La duración y diversión requieren pruebas posteriores con jugadores.

## Archivos de extensión

- `src/data/expansion.ts`: proyectos y situaciones adicionales.
- `src/data/world.ts`: distritos, personajes y avance nacional.
- `src/components/LivingWorld.tsx`: mapa, escena y selección de respuestas.
- `src/domain/engine.ts`: consecuencias, recursos y reproducción.
- `src/liones.css`: ambiente visual, animaciones y adaptación a pantalla.

## Sonido y transiciones del Reino de Liones

- Nuevas presentaciones de capítulos y cierre de misión, con ilustración, partículas y movimiento de cámara simulado.
- Avisos de eventos y avances de ejecución; destellos en los recursos que cambian.
- Entrada animada de herramientas y ventanas, y respuesta visual de botones.
- Siete tipos de efectos sonoros sintetizados localmente: interacción, confirmación, capítulo, evento, progreso, cierre y error.
- Control inferior izquierdo para activar/silenciar; ajustes de volumen, transiciones y botón **Probar efectos**. El audio empieza desactivado y requiere interacción. Las preferencias se recuerdan en el navegador.
- **Esc** u **Omitir** retira una transición. Movimiento reducido respeta la preferencia del sistema y también puede elegirse en el juego. No hay música continua.
- Esta capa visual y sonora no cambia fórmulas, recursos, semillas ni puntuación. Funciona con partidas anteriores.

Validación: 43 pruebas aprobadas; control de sonido y vista previa comprobados en navegador. La calidad audible debe ajustarse al volumen del equipo del jugador; no se realizó medición acústica.

## Panel interactivo de recursos

Las ocho tarjetas superiores ahora abren un detalle accesible por teclado o toque, con explicación, decisiones que influyen y una ilustración isométrica original en SVG. Luces y nivel representan simbólicamente el indicador seleccionado; no añaden variables físicas al motor.

Los cambios recientes muestran su magnitud; las mejoras y el deterioro usan señales diferentes. La caída del saldo por gastar o comprometer se presenta como movimiento de recursos, sin calificarla automáticamente como mala decisión. El riesgo bajo es favorable. El detalle conserva la última variación detectada durante la sesión del panel; recargar no recrea cambios ni sonidos.

El presupuesto separa caja, compromisos, saldo libre, gasto ejecutado, contingencia y capital de crédito contratado. La contingencia no se cuenta como dinero adicional. El indicador ambiental se llama **Potencial ambiental** para distinguirlo de los impactos ODS finales.

Se añadieron sonidos para financiación, gasto, mejora de indicadores y deterioro. Los eventos y cambios de capítulo tienen prioridad para evitar superponer avisos. Se mantienen silencio, volumen y movimiento reducido.

Validación: 47 pruebas aprobadas, comprobación de tipos y revisión visual de barra y detalle de caja en navegador. Compatible con partidas existentes.

## Premios e informe final · septiembre de 2026

Cada cierre presenta una colección de cinco insignias con las evidencias obtenidas y los requisitos pendientes: Cartógrafo del problema (relaciones causales y objetivo), Arquitecto de soluciones (cadena de valor), Guardián de la evidencia (indicadores de producto y resultado), Decisor preparado (estudios y mitigación) y Reconstructor del distrito (ejecución en plazo, cobertura y beneficio social). Las insignias reconocen decisiones verificables, no certifican aprendizaje ni viabilidad oficial; no modifican caja ni puntuación. Un proyecto abandonado puede conservar logros de formulación.

El informe final presenta la valoración de 0–100, resultados esperados y observados, metas e indicadores, dimensiones y pesos, recursos, premios, lecciones, justificación, reflexión y diario. La descarga produce un HTML autónomo para abrir sin conexión o imprimir como PDF desde el navegador. Para incorporar una reflexión nueva, guardarla antes de descargar de nuevo. Los cierres sin servicio no atribuyen la cobertura o los beneficios del proyecto terminado.

Bandas educativas: 85–100 destacado; 70–84 sólido; 50–69 en desarrollo; 0–49 necesita revisión. Se mantiene la fórmula del motor por rol y el factor de 0,35 para abandono e insolvencia. La cifra combina calidad de estrategia y desempeño observado; no mide por sí sola adquisición de conocimientos.

La pantalla inicial muestra el avance al premio «Consejero de la reconstrucción del Reino de Liones». Requiere los nueve proyectos con ejecución finalizada, incluso si terminaron fuera de plazo; abandono e insolvencia no completan un distrito. La valoración final es el promedio de la mejor puntuación por proyecto. Repetir uno no suma distritos. Los mejores registros se guardan aparte de los últimos 30 informes, en el mismo navegador.

Implementación: `src/domain/recognition.ts` contiene reglas, resumen de campaña y exportación; `src/features/Recognition.tsx` presenta los premios y el informe; `src/recognition.css` define su aspecto. El guardado admite partidas anteriores sin registros de campaña.

Validación: 55 pruebas aprobadas, TypeScript y compilación de producción correctos. Revisión en navegador del cierre de una partida de prueba, insignias, informe, recuperación desde historial y archivo HTML descargado. Vite mantiene un aviso de tamaño del paquete principal; no impide compilar ni ejecutar.

## Ruta de aprendizaje MGA y evaluación económica

Se reemplazaron los retos sin registro por 16 casos con primera respuesta guardada, nivel de seguridad, retroalimentación y aplicación en otra situación. La ruta aparece en las ocho etapas y permite repasar desde resultados anteriores. El informe descargable incorpora estas evidencias sin modificar la puntuación del proyecto.

Evaluación incorpora un laboratorio de descuento con predicción, tasa y retrasos, más una comparación calculada de los VPN de la alternativa real ante un año adicional de retraso. Las referencias distinguen metodología MGA, registro en MGA Web, regulación económica y requisitos jurídicos.

Detalles, fuentes y límites pedagógicos: APRENDIZAJE_MGA.md. Verificado: 63 pruebas, TypeScript, compilación de producción, recuperación de respuestas, transferencia, teclado y laboratorio móvil. Se mantiene el aviso de Vite sobre el tamaño del paquete principal.

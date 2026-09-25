# PROYECTA · Reconstruir Aurora

Simulador educativo local en español para formular, evaluar y gestionar proyectos de inversión. Aurora es un territorio ficticio. Los datos y parámetros son simulados; no acredita viabilidad oficial ni sustituye MGA Web.

## Requisitos e instalación

Node.js 24 y pnpm 11.19.0. Instalar pnpm si no se dispone de él: `npm install -g pnpm@11.19.0`. Desde la carpeta del proyecto ejecutar `pnpm install --frozen-lockfile`. El archivo `pnpm-lock.yaml` conserva versiones. No hacen falta variables de entorno ni claves API.

| Comando | Función |
|---|---|
| `pnpm dev` | Servidor local; abrir la dirección mostrada, normalmente http://127.0.0.1:5173 |
| `pnpm check` | Tipos, pruebas y compilación |
| `pnpm repo:check` | Revisar archivos preparados para Git y patrones de credenciales |
| `pnpm test` | Pruebas Vitest del motor y cálculos |
| `pnpm build` | Comprobación TypeScript y compilación en `dist/` |
| `pnpm preview` | Revisar el build estático localmente |
| `node node_modules/typescript/bin/tsc -b` | Comprobar tipos sin emitir JS |

No hay comando lint configurado. En Windows, después de instalar dependencias, `ABRIR_PROYECTA.cmd` inicia/reutiliza Vite en el puerto 5173 y abre una ventana de aplicación. Los registros están en `.local/`. En otras plataformas utilizar `pnpm dev`.

## Arquitectura real

React 19 + TypeScript, Vite 6, TailwindCSS 4, Recharts y Lucide. SPA sin backend ni router: App coordina inicio, ayuda, historial y partida. El motor puro `act` confirma decisiones; formularios y controles mantienen propuestas locales hasta confirmar. Financiación y eventos se procesan en el motor, no en los gráficos.

- `src/data/`: misiones, ODS, marcos históricos y parámetros de balance.
- `src/domain/`: tipos, reglas, economía, persistencia, eventos, evaluación y pruebas.
- `src/features/`: módulos de las ocho etapas, aprendizaje, resultados y centro de mando.
- `src/components/`: controles, gráficos, navegación, personajes y efectos.
- `public/art/`: ilustraciones locales.
- `scripts/`: lanzador Windows.
- `.local/`: registros y comprobaciones de desarrollo, fuera del build.

## Persistencia y compatibilidad

localStorage del mismo navegador y origen. `proyecta-v1` conserva partida activa, resultados, campaña y partidas en pausa. `?qa=1` usa un espacio independiente para pruebas. No hay cuentas, sincronización ni seguimiento externo. Limpiar datos del navegador elimina las partidas; cambiar de puerto o navegador usa otro origen. Si falla el guardado, aparece un aviso y la sesión continúa en memoria.

`createGame` conserva las reglas anteriores; la interfaz inicia con `createGameV2`, que agrega estado V2 sin migrar silenciosamente puntuaciones antiguas. Las partidas nuevas tienen navegación libre antes de invertir y revisiones de dependencias. Confirmar cambios en una etapa ya completada tiene un costo explícito; visitar no cuesta. Después de comprometer inversión, se usan respuestas de ejecución.

## Compilación y distribución

El resultado de `pnpm build` está en `dist/`. No se ha publicado. Para distribuirlo se puede servir esa carpeta mediante un servidor estático bajo su ruta raíz; abrir `index.html` con `file://` no es el modo de ejecución. `pnpm preview` verifica el build, no es una configuración de producción. El simulador no requiere servicios de red durante la partida; instalar dependencias sí requiere conectividad. Las referencias oficiales se abren solo al pulsarlas.

## Solución de problemas

- Dependencias ausentes: ejecutar `pnpm install --frozen-lockfile`.
- Puerto ocupado: cerrar la otra instancia o revisar `.local/servidor-error.log`; el lanzador exige 5173 para conservar el origen del guardado.
- Node no reconocido: instalar Node 24 y abrir otra terminal.
- Guardado no disponible: mantener la pestaña abierta y revisar permisos/cuota del navegador.
- Los gráficos y las dependencias se distribuyen en paquetes separados. Revisa el informe de Vite si futuras ampliaciones vuelven a superar su umbral de tamaño.

## Continuar el desarrollo

V2 añade cadena de valor construible, clasificación de actores, argumentos regulatorios/ODS, práctica con pistas, radar de puntuación y reinicio de etapa con confirmación. El reinicio conserva compras y gastos, y marca evaluaciones dependientes para revisión. Para probar las nuevas reglas, iniciar una misión nueva; las partidas anteriores mantienen su formato. Ver `ENTREGA_V2.md` para la cobertura real de pruebas y trabajo pendiente.

Leer `MANUAL_CREACION.md`, `AUDITORIA_V2.md` y `APRENDIZAJE_MGA.md`. Agregar contenido mediante datos, reglas en domain y presentación en features. No sustituir la realidad oculta al comprar estudios ni usar sorteos nuevos al recargar. Mantener las pruebas anteriores y agregar casos V2 antes de cambiar compatibilidad, puntuación o compromisos. Consultar el estado de implementación al principio del manual y registrar futuras instrucciones en su historial.

## GitHub y documentación

Repositorio preparado para revisión local; no publicado. Sigue [la guía para GitHub](docs/GUIA_GITHUB.md). El flujo de CI valida el proyecto sin desplegarlo. Node y pnpm están fijados en `.nvmrc` y `package.json`.

- [Estado de la entrega](ENTREGA_V2.md) y [cambios](CHANGELOG.md).
- [Cómo contribuir](CONTRIBUTING.md) y [seguridad](SECURITY.md).
- [Licencia pendiente y recursos](docs/LICENCIA_Y_RECURSOS.md).
- [Protocolo de validación con estudiantes](docs/PILOTO_PEDAGOGICO.md).

El repositorio incluye el historial de instrucciones de diseño en `MANUAL_CREACION.md`, conservado por requisito del proyecto. No incluye conversaciones privadas externas, partidas del navegador ni datos de estudiantes.

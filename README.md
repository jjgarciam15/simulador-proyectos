# PROYECTA · Reconstruir Aurora

Simulador educativo en español de **formulación y evaluación de proyectos**. El jugador administra un proyecto en un territorio ficticio (Aurora): tiene presupuesto y tiempo limitados, compra información, elige una alternativa, construye la cadena de valor y el presupuesto, enfrenta dilemas y eventos, decide la regulación y los ODS, y al final ve las consecuencias de sus decisiones con una nota explicada.

Integra MGA, economía, regulación económica, gestión de recursos, evaluación ex ante, riesgo y ODS. Los datos son simulados: no acredita viabilidad oficial ni sustituye MGA Web.

## Propósito

Pasar de «respondo actividades para avanzar» a «administro un proyecto y mis decisiones tienen consecuencias». El simulador recompensa analizar, priorizar, administrar, justificar, anticipar y corregir.

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | React 19 + TypeScript 5.8 |
| Compilación | Vite 6 |
| Estilos | Tailwind CSS 4 y hojas CSS propias (`src/*.css`) |
| Gráficos | Recharts |
| Íconos | Lucide |
| Pruebas | Vitest |
| Paquetes | pnpm 11.19.0 |

No hay backend, base de datos, cuentas ni servicios externos: es una aplicación estática.

## Requisitos

- **Node.js 24** (fijado en `.nvmrc` y en `engines` de `package.json`). Con Node 22 funciona, pero pnpm muestra un aviso «Unsupported engine».
- **pnpm 11.19.0**. Si no lo tienes: `npm install -g pnpm@11.19.0`.

## Instalación

```bash
git clone https://github.com/jjgarciam15/simulador-proyectos.git
cd simulador-proyectos
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` fija las versiones exactas.

## Variables de entorno

No se requieren variables de entorno ni claves API.

## Desarrollo y ejecución

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en http://127.0.0.1:5173 |
| `pnpm typecheck` | Comprobación de tipos (`tsc -b`) |
| `pnpm test` | Pruebas Vitest del motor, puntuación y contenido |
| `pnpm build` | Tipos + compilación de producción en `dist/` |
| `pnpm preview` | Sirve `dist/` localmente para revisarlo |
| `pnpm check` | Tipos, pruebas y compilación (lo que ejecuta la CI) |
| `pnpm repo:check` | Revisa que no se versionen dependencias, compilaciones ni credenciales |

No hay comando de lint configurado.

En Windows, después de instalar dependencias, `ABRIR_PROYECTA.cmd` inicia (o reutiliza) Vite en el puerto 5173 y abre una ventana de aplicación. Los registros quedan en `.local/`.

## Pruebas

```bash
pnpm test
```

Cubren: motor y finanzas, puntuación V2 (nueve dimensiones, bonificaciones y penalizaciones), presupuesto y su diagnóstico, cadena de valor, dependencias y «requiere revisión», dilemas y consecuencias diferidas, semilla determinista, laboratorio regulatorio, ODS, dificultad, persistencia y el catálogo completo (nueve misiones × tres dificultades). Última ejecución: 156 pruebas en 14 archivos, todas aprobadas.

## Compilación

```bash
pnpm build
```

Genera `dist/` con `index.html`, `assets/` y `art/`. Es un sitio estático.

## Despliegue

`dist/` se puede publicar en cualquier hosting estático. No abras `index.html` con `file://`: debe servirse por HTTP.

**En la raíz de un dominio** (Netlify, Vercel, Cloudflare Pages, un servidor Nginx/Apache):

1. Comando de compilación: `pnpm build`.
2. Carpeta de publicación: `dist`.
3. Versión de Node: 24.

La app no tiene rutas internas (no usa router), así que no requiere reglas de reescritura.

**En una subruta** (por ejemplo GitHub Pages en `https://usuario.github.io/simulador-proyectos/`):

```bash
pnpm typecheck
pnpm exec vite build --base=/simulador-proyectos/
```

Las imágenes y los recursos respetan la ruta base (`import.meta.env.BASE_URL`). Publica el contenido de `dist/` en esa subruta.

**Comprobación local del build:** `pnpm preview` (no es un servidor de producción).

La CI de GitHub (`.github/workflows/ci.yml`, «Validar simulador») ejecuta `pnpm install --frozen-lockfile`, `pnpm repo:check` y `pnpm check` en cada push a `main` y en cada pull request. **No despliega.**

## Persistencia

- La partida se guarda automáticamente en el `localStorage` del navegador (clave `proyecta-v1`) tras cada decisión confirmada.
- Se puede cerrar la pestaña y continuar después («Continuar misión»). Al empezar otra misión, la actual queda **en pausa** y se puede retomar desde el inicio.
- `?qa=1` usa un espacio de guardado separado (`proyecta-qa-v1`) para pruebas.
- Si el guardado falla, aparece un aviso y la sesión sigue en memoria.
- Limpiar los datos del navegador borra las partidas. Otro navegador, puerto o dominio usa otro almacenamiento.
- No hay cuentas, sincronización ni seguimiento externo.

## Arquitectura

```
src/
  data/        Contenido y balance: misiones, dilemas, ODS, reglas de dificultad y puntuación
  domain/      Reglas puras: motor (act), estado, dilemas, regulación, presupuesto,
               coherencia, puntuación, persistencia, validación y pruebas
  features/    Pantallas de cada etapa y herramientas (dilemas, laboratorio, resultados)
  components/  Controles, gráficos, navegación, personajes y efectos
public/art/    Ilustraciones locales
scripts/       Lanzador de Windows y revisión del repositorio
```

- **Motor único y puro:** `act(estado, acción)` en `src/domain/engine.ts` valida y devuelve un estado nuevo. La interfaz nunca calcula reglas ni puntuación.
- **Estado central:** `GameState` (`src/domain/types.ts`) con `v2` versionado (`src/domain/projectV2.ts`): etapas completadas, revisiones, cadena, actores, ODS, regulación, dilemas, consecuencias, etc.
- **Contenido configurable:** las nueve misiones se generan desde datos (`src/data/scenarios.ts`, `expansion.ts`); los dilemas son plantillas declarativas (`src/data/dilemmas.ts`); el balance está en `src/data/balance.ts`.
- **Semilla:** el código de condiciones reproduce demanda, costos técnicos, severidad de la falla regulatoria, eventos y dilemas.

La memoria técnica completa está en [`MANUAL_CREACION.md`](MANUAL_CREACION.md) y la ejecución de esta versión en [`IMPLEMENTATION_PLAN_V2.md`](IMPLEMENTATION_PLAN_V2.md).

## Solución de problemas

| Problema | Solución |
|---|---|
| `Cannot find module` o dependencias ausentes | `pnpm install --frozen-lockfile` |
| Aviso «Unsupported engine» | Usa Node 24 (`nvm use`); con Node 22 funciona igual |
| Puerto 5173 ocupado | Cierra la otra instancia o revisa `.local/servidor-error.log` (lanzador Windows) |
| La partida no se guarda | Revisa permisos o cuota del almacenamiento del navegador; mantén la pestaña abierta |
| «No se pudo leer la partida guardada» | El guardado es de un formato incompatible; se conserva una copia en `proyecta-v1:unreadable` al guardar una nueva |
| Imágenes rotas tras publicar en una subruta | Compila con `--base=/tu-subruta/` (ver Despliegue) |
| Pantalla en blanco al abrir `dist/index.html` | Sírvelo por HTTP (`pnpm preview` o un hosting estático) |

## Documentación

- [Memoria de creación e historial de prompts](MANUAL_CREACION.md)
- [Plan y resultado de la implementación V2](IMPLEMENTATION_PLAN_V2.md)
- [Entrega V2](ENTREGA_V2.md) · [Cambios](CHANGELOG.md)
- [Cómo contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md)
- [Guía para GitHub](docs/GUIA_GITHUB.md) · [Licencia pendiente y recursos](docs/LICENCIA_Y_RECURSOS.md) · [Protocolo de piloto pedagógico](docs/PILOTO_PEDAGOGICO.md)

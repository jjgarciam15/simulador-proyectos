# Preparar y subir a GitHub

El proyecto está preparado localmente. No se ha creado un repositorio remoto, subido archivos ni activado GitHub Pages.

Estado de esta preparación: Git inicializado en `main`, archivos preparados en el índice y revisados. No se creó el primer commit porque este equipo no tiene una identidad de autor de Git configurada; no se inventaron nombre o correo. Las instrucciones siguientes permiten completar ese paso con tu identidad.

## Comprobación local

```sh
pnpm install --frozen-lockfile
pnpm check
git add .
pnpm repo:check
git diff --cached --stat
```

El índice debe incluir código, documentación, configuración, lockfile e ilustraciones. No debe incluir `node_modules`, `.pnpm-store`, `.local`, `dist`, registros, claves o exportaciones de partidas. Las partidas en localStorage no forman parte de la carpeta.

## Primer envío

1. Crea en tu cuenta un repositorio vacío con el nombre que elijas; evita inicializar otro README o licencia. Decide su visibilidad. Para mantener el trabajo sin conceder una licencia abierta, puede empezar como privado.
2. Comprueba tu identidad de Git con `git var GIT_AUTHOR_IDENT`. Si no está configurada, define tu nombre y correo en este repositorio; no uses datos de otra persona.
3. Crea el primer commit y conecta la URL real que te dé GitHub:

```sh
git commit -m "Preparar PROYECTA V2: simulador MGA y evaluación económica"
git remote add origin URL_REAL_DEL_REPOSITORIO
git push -u origin main
```

`URL_REAL_DEL_REPOSITORIO` es un marcador que debes sustituir, no un comando listo para copiar. No pegues tokens en URLs o archivos del proyecto. Usa la autenticación habitual de GitHub Desktop o Git Credential Manager.

## Después del envío

El flujo **Validar simulador** ejecutará revisión de archivos, TypeScript, Vitest y compilación en pushes a `main` y pull requests. Su primera ejecución en GitHub todavía debe verificarse; las comprobaciones locales no prueban la infraestructura remota. No hay workflow de despliegue.

Consultar [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node) y [pnpm/action-setup](https://github.com/pnpm/action-setup) para las acciones configuradas. Usan permisos de lectura y checkout sin credenciales persistentes.

Antes de distribuir públicamente, resolver `LICENCIA_Y_RECURSOS.md`. La hoja de ruta y los límites de validación están en `ENTREGA_V2.md`; el piloto pedagógico propuesto está en `PILOTO_PEDAGOGICO.md`.

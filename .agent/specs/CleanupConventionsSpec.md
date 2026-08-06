# Spec: limpieza de scaffold + convenciones de nombres en inglés + estructura fija de .vue
 
## Contexto
 
Proyecto: `pavh-frontend`. Lee `AGENT.md` y `PROJECT.md` antes de empezar. El sidebar/topbar y la reestructuración de `router/` en carpetas por módulo (spec anterior) ya están implementados y verificados — este spec es limpieza + estandarización de convenciones sobre esa base, no cambia funcionalidad.
 
## Objetivo
 
1. Eliminar todo el scaffold de Vite/Vue sin usar.
2. Traducir a inglés todo lo que es **código** (nombres de archivo, carpetas, componentes, identificadores de ruta, comentarios) — sin tocar el **contenido de negocio visible al usuario final**, que se queda en español.
3. Estandarizar todos los archivos `.vue` del proyecto para que sigan siempre la misma distribución de bloques.
## Regla clave: qué se traduce y qué NO
 
Esto es lo más importante del spec — no confundir ambos:
 
| Se traduce a inglés (código) | Se queda en español (negocio) |
|---|---|
| Nombres de archivo (`InventarioView.vue` → `InventoryView.vue`) | Texto visible en pantalla (labels del sidebar: "Inventario", "Cotizaciones", "Punto de venta") |
| Nombres de carpeta (`views/inventario/` → `views/inventory/`) | Contenido de placeholders ("Este módulo está en construcción.") |
| Nombres de componente (`<InventarioView />` → `<InventoryView />`) | Cualquier texto que el usuario final del negocio (cliente de pisos y materiales) va a leer |
| Identificador `name` de las rutas de Vue Router (`name: 'inventario'` → `name: 'inventory'`) | — |
| Comentarios dentro de código (`<!-- Navegación principal -->` → `<!-- Main navigation -->`) | — |
| Nombres de variables/props/funciones | — |
 
**Los `path` de las rutas (URLs) NO se tocan** — se quedan como `/inventario`, `/cotizaciones`, etc. Son parte del negocio/URL visible, no identificadores internos de código. Si prefieres que también se traduzcan, dímelo y ajustamos, pero el spec asume que se quedan igual.
 
## Mapeo de nombres a aplicar
 
| Actual | Nuevo |
|---|---|
| `src/views/inventario/` | `src/views/inventory/` |
| `src/views/inventario/InventarioView.vue` | `src/views/inventory/InventoryView.vue` |
| `src/views/cotizaciones/` | `src/views/quotes/` |
| `src/views/cotizaciones/CotizacionesView.vue` | `src/views/quotes/QuotesView.vue` |
| `src/views/pos/PosView.vue` | Sin cambio — "pos" ya es un término técnico en inglés |
| `src/router/inventario/` | `src/router/inventory/` |
| `src/router/inventario/inventario.routes.js` | `src/router/inventory/inventory.routes.js` |
| `src/router/cotizaciones/` | `src/router/quotes/` |
| `src/router/cotizaciones/cotizaciones.routes.js` | `src/router/quotes/quotes.routes.js` |
| Ruta `name: 'inventario'` | `name: 'inventory'` |
| Ruta `name: 'cotizaciones'` | `name: 'quotes'` |
 
Todo lo demás (`auth/`, `dashboard/`, `pos/`, componentes de layout, `Login.vue`, `stores/auth.js`) ya está en inglés — no se toca su nombre.
 
## Estructura fija de bloques en `.vue`
 
Todo archivo `.vue` del proyecto (existentes y futuros) debe seguir siempre este orden, sin excepción, aunque un bloque quede vacío:
 
```vue
<template>
 
</template>
 
<script setup>
 
</script>
 
<style scoped>
 
</style>
```
 
- Si un componente no necesita estilos propios, el bloque `<style scoped>` se deja vacío — no se omite.
- No usar `<script>` sin `setup` en ningún archivo nuevo o existente.
- No usar `<style>` global (sin `scoped`) salvo que sea justificado y explícito (no debería ser el caso en este proyecto).
## Fuera de alcance (no hacer)
 
- No traducir texto visible al usuario final (labels de nav, títulos de página, placeholders, mensajes).
- No cambiar los `path` de las rutas.
- No tocar la lógica de `stores/auth.js`, el guard de `router/index.js`, ni el flujo de auth.
- No agregar librerías de UI ni implementar roles/permisos.
## Pasos (en orden, uno por uno)
 
1. **Eliminar scaffold sin usar**: `HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, la carpeta `icons/`, `stores/counter.js`, `AboutView.vue`. Verificar que no queden imports ni referencias rotas a estos archivos en ningún otro archivo (incluyendo rutas de `About` si existieran en algún `.routes.js`).
2. **Renombrar la carpeta y vista de Inventario**: `src/views/inventario/` → `src/views/inventory/`, `InventarioView.vue` → `InventoryView.vue`. El contenido interno (texto visible) no cambia.
3. **Renombrar la carpeta y vista de Cotizaciones**: `src/views/cotizaciones/` → `src/views/quotes/`, `CotizacionesView.vue` → `QuotesView.vue`. El contenido interno no cambia.
4. **Renombrar la carpeta y archivo de rutas de Inventario**: `src/router/inventario/` → `src/router/inventory/`, `inventario.routes.js` → `inventory.routes.js`. Actualizar el `import` correspondiente del componente (nueva ruta de archivo) y el `name: 'inventory'`.
5. **Renombrar la carpeta y archivo de rutas de Cotizaciones**: `src/router/cotizaciones/` → `src/router/quotes/`, `cotizaciones.routes.js` → `quotes.routes.js`. Actualizar el `import` del componente y el `name: 'quotes'`.
6. **Actualizar `router/index.js`**: los imports de `inventarioRoutes`/`cotizacionesRoutes` pasan a `inventoryRoutes`/`quotesRoutes` (nombre de variable en inglés también, por consistencia).
7. **Actualizar `AppSidebar.vue`**: el array `navLinks` debe apuntar a `{ name: 'inventory' }` y `{ name: 'quotes' }` en vez de los nombres en español — el `label` de texto visible (`"Inventario"`, `"Cotizaciones"`) se queda igual.
8. **Traducir comentarios de código dentro de archivos `.vue`** a inglés (ejemplo: `<!-- Navegación principal -->` → `<!-- Main navigation -->`, `<!-- Configuración: sin ruta todavía, placeholder visual -->` → `<!-- Settings: no route yet, visual placeholder -->`). Solo comentarios de código — no tocar texto dentro de elementos que el usuario ve.
9. **Aplicar la estructura fija de bloques** (`template` → `script setup` → `style scoped`, siempre los 3, incluso vacíos) a todos los `.vue` existentes: `App.vue`, `AppLayout.vue`, `AuthLayout.vue`, `AppSidebar.vue`, `AppTopbar.vue`, `Login.vue`, `HomeView.vue`, `InventoryView.vue`, `QuotesView.vue`, `PosView.vue`. Además, agregar esta convención a `AGENT.md`, en la sección "Convenciones de código (frontend)", con el bloque de ejemplo (`template`/`script setup`/`style scoped` vacíos) tal cual aparece en este spec — así cualquier sesión futura (de Claude Code o de este chat) tiene la referencia exacta sin depender de que se le recuerde manualmente.
10. **Verificar que no queden referencias rotas**: correr `npm run dev`, navegar por las 4 secciones del sidebar, confirmar que no hay errores en consola y que el login/logout sigue funcionando.
## Checklist de aceptación
 
- [ ] `HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, `icons/`, `stores/counter.js`, `AboutView.vue` ya no existen en el repo
- [ ] Ningún archivo o carpeta de código (vistas, rutas, componentes) tiene nombres en español, excepto lo explícitamente fuera de alcance (paths de URL)
- [ ] Los `name` de las rutas de Vue Router están en inglés y coinciden entre `.routes.js` y cualquier `:to` que los referencie (`AppSidebar.vue`)
- [ ] Todo texto visible al usuario final (labels, títulos, placeholders) sigue en español, sin cambios
- [ ] Cada `.vue` del proyecto tiene exactamente `<template>` → `<script setup>` → `<style scoped>`, en ese orden, sin bloques adicionales u omitidos
- [ ] Comentarios de código dentro de `.vue` están en inglés
- [ ] `npm run dev` corre sin errores de consola; navegación entre Dashboard/Inventario/Cotizaciones/POS funciona igual que antes
- [ ] Commits siguen Conventional Commits + gitmoji en inglés (ver `PROJECT.md`)
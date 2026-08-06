# Spec: Sidebar + reestructuración de router por módulos
 
## Contexto
 
Proyecto: `pavh-frontend` (Vue 3 + Vite + Pinia + Vue Router + Tailwind v4).
Lee `AGENT.md` y `PROJECT.md` en la raíz del repo antes de empezar — ahí están las convenciones de código, paleta de colores y reglas de entorno del proyecto. Este spec no las repite salvo cuando aplica directamente al layout.
 
**Estado actual relevante:**
- `src/router/index.js` tiene las rutas de login y dashboard definidas inline, más el guard `beforeEach` que hidrata sesión con `fetchUser`.
- `src/views/login/Login.vue` ya existe y funciona — no se toca su contenido, solo su registro de ruta.
- `HomeView.vue` se usa hoy como placeholder tanto en `/` como en `/dashboard`.
- `src/layouts/AppLayout.vue` y `AuthLayout.vue` existen pero el sidebar y topbar reales no se han construido todavía.
## Objetivo
 
1. Migrar **todas** las rutas (auth + dashboard + las nuevas) a una convención de carpetas por módulo dentro de `src/router/`.
2. Construir `AppSidebar.vue` y `AppTopbar.vue` según el layout ya aprobado (ver sección "Diseño del sidebar/topbar").
3. Crear vistas placeholder reales para Inventario, Cotizaciones y Punto de Venta, con sus rutas correspondientes, para que la navegación del sidebar funcione de punta a punta.
## Fuera de alcance (no hacer)
 
- No implementar lógica de negocio de ningún módulo (catálogo, cotizaciones, ventas). Los placeholders son solo un contenedor con título de página, nada más.
- No agregar librerías de UI nuevas (shadcn-vue, Headless UI, PrimeVue, etc.).
- No implementar roles/permisos, aunque el sidebar "sugiera" un próximo paso obvio en esa dirección.
- No modificar el contenido de `Login.vue` ni la lógica de `stores/auth.js` — solo su punto de registro en el router.
- No eliminar todavía el scaffold sin usar (`HelloWorld.vue`, `TheWelcome.vue`, etc.) — es una tarea de limpieza aparte.
## Convención nueva de `src/router/`
 
Cada módulo de negocio (y auth) tiene su propia carpeta dentro de `src/router/`, con un archivo `.js` que exporta un arreglo de rutas. `router/index.js` importa cada arreglo y los combina.
 
```
src/router/
  index.js
  auth/
    auth.routes.js
  dashboard/
    dashboard.routes.js
  inventario/
    inventario.routes.js
  cotizaciones/
    cotizaciones.routes.js
  pos/
    pos.routes.js
```
 
**Convención de nombres:**
- Archivo: `<modulo>.routes.js` (todo minúsculas)
- Export: `export default` de un arreglo, nombrado `<modulo>Routes` en el import (ej. `import authRoutes from './auth/auth.routes.js'`)
- Cada objeto de ruta usa `meta.title` (para que `AppTopbar.vue` lo lea sin acoplarse a cada vista) y `meta.requiresAuth` (booleano explícito, no inferido)
**Ejemplo de un archivo de módulo** (`src/router/inventario/inventario.routes.js`):
 
```js
export default [
  {
    path: '/inventario',
    name: 'inventario',
    component: () => import('@/views/inventario/InventarioView.vue'),
    meta: { title: 'Inventario', requiresAuth: true }
  }
]
```
 
**`router/index.js` resultante** debe combinar los arreglos así:
 
```js
import authRoutes from './auth/auth.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import inventarioRoutes from './inventario/inventario.routes.js'
import cotizacionesRoutes from './cotizaciones/cotizaciones.routes.js'
import posRoutes from './pos/pos.routes.js'
 
const routes = [
  ...authRoutes,
  ...dashboardRoutes,
  ...inventarioRoutes,
  ...cotizacionesRoutes,
  ...posRoutes
]
```
 
El guard `beforeEach` existente (hidratación de sesión + redirect a `/login`) se queda en `router/index.js`, sin cambios de lógica — solo ajustar si referencia algo de las rutas movidas.
 
## Diseño del sidebar/topbar (ya aprobado)
 
**Sidebar** — fijo, ancho ~200px, fondo `primary` (`#14293D`):
- Wordmark "PV" arriba, fuente Source Serif 4, separado por borde inferior sutil
- Grupo de navegación principal, en este orden:
  1. Dashboard (`ti-layout-dashboard`)
  2. Inventario (`ti-package`)
  3. Cotizaciones (`ti-file-description`)
  4. Punto de venta (`ti-shopping-cart`)
- Item activo: barra de 2px en `accent` (`#A67C3D`) al lado izquierdo, fondo ligeramente resaltado, texto en blanco. Usar `router-link-active` / `router-link-exact-active` de Vue Router — no manejar el estado activo a mano con JS.
- Al fondo del sidebar (separado con borde superior): "Configuración" con menor jerarquía visual (color más apagado)
**Topbar** — blanco, 52px alto, borde inferior 1px `border`, sin sombra:
- Izquierda: título de la página actual, leído de `route.meta.title`
- Derecha: nombre del usuario autenticado (desde `useAuthStore`) + avatar circular con iniciales sobre fondo `primary`
**Tokens a usar** (ya definidos en `AGENT.md`, no hardcodear hex fuera de `@theme`): `primary`, `primary-dark`, `accent`, `bg`, `surface`, `border`, `text`, `text-muted`.
 
## Pasos (en orden, uno por uno)
 
1. **Crear la estructura de carpetas `src/router/`** con los 5 subdirectorios vacíos listados arriba.
2. **Extraer las rutas de auth** de `router/index.js` a `src/router/auth/auth.routes.js`, sin cambiar su comportamiento.
3. **Extraer las rutas de dashboard** a `src/router/dashboard/dashboard.routes.js`. La ruta `/dashboard` sigue usando `HomeView.vue` como placeholder (no se toca esa vista todavía).
4. **Crear las vistas placeholder** para los 3 módulos nuevos:
   - `src/views/inventario/InventarioView.vue`
   - `src/views/cotizaciones/CotizacionesView.vue`
   - `src/views/pos/PosView.vue`
   
   Cada una: un `<template>` simple con un `<h1>` (Source Serif 4, vía la clase de tipografía que ya exista en el proyecto) con el nombre del módulo, y un párrafo de texto muted diciendo "Este módulo está en construcción." Nada más — sin lógica, sin llamadas a API.
5. **Crear los archivos de ruta** para los 3 módulos nuevos (`inventario.routes.js`, `cotizaciones.routes.js`, `pos.routes.js`), cada uno apuntando a su vista placeholder con `meta.requiresAuth: true`.
6. **Actualizar `router/index.js`** para importar y combinar los 5 arreglos de rutas, dejando el guard `beforeEach` intacto en su lógica.
7. **Crear `src/components/layout/AppSidebar.vue`** con la navegación descrita arriba, usando `<router-link>` para cada item.
8. **Crear `src/components/layout/AppTopbar.vue`** leyendo `route.meta.title` y el usuario desde `useAuthStore`.
9. **Integrar ambos componentes en `AppLayout.vue`**, reemplazando cualquier placeholder que tenga hoy.
10. **Probar en el navegador**: login → navegar entre Dashboard / Inventario / Cotizaciones / Punto de venta desde el sidebar, confirmando que el topbar cambia de título y que el item activo se resalta correctamente.
## Checklist de aceptación
 
- [ ] `src/router/index.js` no tiene definiciones de rutas inline, solo imports + combinación de arreglos
- [ ] Cada módulo tiene su carpeta con un archivo `.js` que exporta un arreglo de rutas
- [ ] Las 3 vistas placeholder nuevas existen y son navegables desde el sidebar
- [ ] El guard de autenticación sigue funcionando igual que antes (probar logout → redirect a `/login`)
- [ ] Sidebar usa los tokens de color definidos en `@theme` (`primary`, `accent`, etc.), no hex sueltos
- [ ] Topbar usa Inter; el único lugar con Source Serif 4 es el wordmark del sidebar y los `<h1>` de cada vista
- [ ] Item activo del sidebar usa `router-link-active`, no un `ref` manual
- [ ] Sin sombras pesadas (`box-shadow`) en sidebar, topbar o cards
- [ ] Commits siguen Conventional Commits + gitmoji en inglés (ver ejemplos en `PROJECT.md`)
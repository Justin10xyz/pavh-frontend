# Guía del módulo de Inventario

Esta guía explica cómo usar el módulo de **Inventario**: cómo consultar productos, cómo llevar el control de existencias y cómo revisar el historial de movimientos.

---

## 1. Secciones del inventario

Arriba de la pantalla hay dos botones para cambiar de sección:

- **Catálogo de pisos**: pisos y recubrimientos, organizados por línea, medida y color.
- **Otros productos**: artículos que se venden por unidad, como pegamentos, boquillas o herramientas.

El botón **Nuevo producto** (arriba a la derecha) registra un producto en la sección que tengas abierta. Desde Catálogo de pisos abre el formulario **Nuevo piso**; desde Otros productos, el formulario **Nuevo producto general**.
Al registrarlo, la lista de **Categoría** muestra solo las categorías de esa sección: en pisos, las de tipo *Pisos*; en otros productos, las de tipo *General*. El tipo de cada categoría se configura en **Configuración → Categorías**.

---

## 2. Catálogo de pisos

### Cómo está organizado

Cada piso se muestra en tres niveles:

1. **Producto (línea)**: el nombre del piso, con su categoría, proveedor y unidad de venta.
2. **Medida**: cada tamaño del producto, con sus datos técnicos (PEI, ETT, categoría de comisión), su precio por caja y por m², y cuántas piezas, m² y kilos trae cada caja.
3. **Color**: cada color de esa medida, con su código, su stock en cajas y su estado.

### Abrir y cerrar productos y medidas

- Da **clic en cualquier parte de la fila** de un producto para ver sus medidas. Otro clic la cierra. También puedes usar la flecha de la izquierda.
- Dentro de un producto, da clic en una **medida** para ver sus colores y su stock.

La columna **Variantes** dice cuántos colores tiene el producto en total.

### Avisos de stock bajo

Cuando algún color llega a su **stock mínimo** o baja de él, aparece una etiqueta roja **"N con stock bajo"**:

- en la fila del producto, para saber que tiene faltantes sin abrirlo;
- en la fila de la medida, para saber en cuál está el faltante.

El stock mínimo de cada color se configura al editar el producto.

### Estado de cada color

| Estado | Significado |
| --- | --- |
| **OK** (verde) | El stock está por arriba del mínimo. |
| **Stock bajo** (rojo) | El stock llegó al mínimo o está por debajo. |
| **Sin control** (gris) | Este color no lleva control de existencias. |

### Editar un producto

El ícono de **lápiz** en la fila del producto abre el formulario de edición. Ahí se cambian los datos generales, las medidas, los precios, los colores y el stock mínimo.

---

## 3. Búsqueda y filtros

Arriba de la tabla hay herramientas para encontrar productos rápido:

- **Buscador**: busca por nombre de línea, color o código. No importan los acentos ni las mayúsculas. Si buscas un color o un código, solo se muestran los colores que coinciden.
- **Categoría**: muestra solo los productos de una categoría.
- **Solo stock bajo** (solo en pisos): muestra únicamente los colores que necesitan resurtido.
- **Limpiar filtros**: aparece cuando hay algún filtro activo y los quita todos de una vez.

> Desde el **Dashboard**, al dar clic en una alerta de stock bajo, el catálogo se abre ya filtrado y desplegado en el producto que necesita atención.

---

## 4. Control de stock

Los pisos y los demás productos funcionan igual. La diferencia es que en pisos el stock se cuenta en **cajas** y en otros productos en **unidades**.

### Activar el seguimiento de stock

Si un producto o color dice **Sin control**, da clic en el ícono **⊕ (Activar seguimiento de stock)**:

1. Escribe la cantidad que tienes hoy. Será el **stock inicial** y puede ser 0.
2. Da clic en **Aplicar**.

Desde ese momento, el sistema lleva la cuenta de entradas y salidas.

### Ajustar el stock

En un producto que ya tiene seguimiento, el ícono **Ajustar stock** abre una ventana con dos opciones:

- **Agregar**: para registrar mercancía que llegó.
- **Quitar**: para registrar mermas, piezas rotas o correcciones de conteo.

Escribe la cantidad (mínimo 1) y da clic en **Aplicar**.

> Las **ventas** descuentan el stock en automático. No es necesario quitarlo a mano.

### Desactivar el seguimiento

En la misma ventana de ajuste está el enlace **Desactivar seguimiento de stock**. Pide confirmación antes de hacer el cambio. El producto queda como **Sin control**, y el seguimiento se puede volver a activar cuando quieras.

---

## 5. Historial de stock

El ícono de **reloj (Ver historial de stock)** muestra todos los movimientos de un color o producto:

| Columna | Qué muestra |
| --- | --- |
| **Fecha** | Cuándo ocurrió el movimiento. |
| **Tipo** | **Entrada**, **Salida** o **Desactivado**. |
| **Cantidad** | Cuánto se agregó (+) o se quitó (−). |
| **Origen** | **Stock inicial**, **Ajuste manual**, **Seguimiento desactivado** o el **folio de la venta**. |
| **Stock resultante** | Cuánto quedó después del movimiento. |

---

## 6. Otros productos

Funciona igual que el catálogo de pisos, pero más sencillo. Cada producto es una sola fila con su nombre, categoría, precio y stock en unidades. Desde la fila se puede:

- activar o ajustar el stock,
- ver el historial,
- editar el producto (lápiz).

Esta sección no tiene filtro de stock bajo, porque estos productos no manejan stock mínimo.

---

## Registro de cambios

Mejoras que se van agregando al módulo:

| Fecha | Cambio |
| --- | --- |
| 2026-10-15 | **Catálogo de pisos**: ahora un clic en cualquier parte de la fila del producto abre o cierra sus medidas, no solo la flecha. |
| 2026-10-15 | **Catálogo de pisos**: los productos y las medidas se abren y cierran con una animación suave en lugar de aparecer de golpe. |
| 2026-10-15 | **Nuevo producto (pisos)**: la lista de categorías ya solo muestra las de tipo Pisos, no las de Otros productos. |
| 2026-10-15 | **Formularios**: títulos y descripciones distintos para pisos (*Nuevo piso* / *Editar piso*) y para otros productos (*Nuevo producto general* / *Editar producto general*), para que quede claro qué se está registrando. |

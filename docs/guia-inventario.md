# Guía del módulo de Inventario

Esta guía explica cómo usar el módulo de **Inventario**: cómo consultar productos, cómo llevar el control de existencias y cómo revisar el historial de movimientos.

---

## 1. Secciones del inventario

Arriba de la pantalla hay dos botones para cambiar de sección:

- **Catálogo de pisos**: pisos y recubrimientos, organizados por línea, medida y color.
- **Otros productos**: artículos que se venden por unidad, como pegamentos, boquillas o herramientas.

El botón **Nuevo producto** (arriba a la derecha) registra un producto en la sección que tengas abierta. Desde Catálogo de pisos abre el formulario **Nuevo piso**; desde Otros productos, el formulario **Nuevo producto general**.
Al registrarlo, la lista de **Categoría** muestra solo las categorías de esa sección: en pisos, las de tipo *Pisos*; en otros productos, las de tipo *General*. El tipo de cada categoría se configura en **Configuración → Categorías**.

Si la categoría que necesitas todavía no existe, da clic en el botón **+** junto a la lista de **Categoría**. Se abre la ventana **Nueva categoría** sin salir del formulario, así no pierdes lo que ya capturaste. El tipo de la categoría queda fijo según el formulario (*Pisos* o *General*) y, al guardarla, queda seleccionada en el producto. Para editar o eliminar categorías, o ver todas las que existen, ve a **Configuración → Categorías**.

### Eliminar una categoría

En **Configuración → Categorías**, da clic en el ícono de **bote de basura** de la categoría:

- Si la categoría **no tiene productos**, se pide confirmación antes de eliminarla.
- Si **tiene productos**, no se puede eliminar. La ventana dice cuántos tiene; primero hay que editar esos productos y moverlos a otra categoría.

Una categoría eliminada deja de aparecer en las listas, pero las ventas y cotizaciones anteriores no cambian. Después puedes crear otra con el mismo nombre y prefijo.

### Proveedores

Cada piso tiene un **proveedor** (por ejemplo, Interceramic). Los productos de *Otros productos* no llevan proveedor.

Si el proveedor que necesitas todavía no existe, da clic en el botón **+** junto a la lista de **Proveedor** en el formulario del piso. Se abre la ventana **Nuevo proveedor** sin salir del formulario y, al guardarlo, queda seleccionado en el piso.

Para ver todos los proveedores, cambiarles el nombre o eliminarlos, ve a **Configuración → Proveedores**. No puede haber dos proveedores con el mismo nombre.

### Eliminar un proveedor

En **Configuración → Proveedores**, da clic en el ícono de **bote de basura** del proveedor:

- Si el proveedor **no tiene productos**, se pide confirmación antes de eliminarlo.
- Si **tiene productos**, no se puede eliminar. La ventana dice cuántos tiene; primero hay que editar esos pisos y cambiarles el proveedor.

Un proveedor eliminado deja de aparecer en las listas, pero las ventas y cotizaciones anteriores no cambian. Después puedes crear otro con el mismo nombre.

---

## 2. Catálogo de pisos

### Cómo está organizado

Cada piso se muestra en tres niveles:

1. **Producto (línea)**: el nombre del piso, con su categoría, proveedor y unidad de venta.
2. **Medida**: cada tamaño del producto, con sus datos técnicos (PEI, ETT, [código de comisión](#códigos-de-comisión)), su precio por caja y por m², y cuántas piezas, m² y kilos trae cada caja. En los pisos que se venden por pieza solo se muestra el precio por pieza (ver [Pisos que se venden por pieza](#pisos-que-se-venden-por-pieza)).
3. **Color**: cada color de esa medida, con su código, su stock en cajas (o en piezas) y su estado.

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

### Códigos de comisión

Cada medida puede llevar un **código de comisión**, que indica cuánta comisión le deja al vendedor y, por lo tanto, cuánto descuento se le puede dar al cliente. En el catálogo aparece junto al PEI y el ETT como un **punto de color con su código**; al pasar el cursor encima se ve su nombre.

| Código | Color | Comisión para el vendedor |
| --- | --- | --- |
| **Vo** | Verde oscuro | La más alta |
| **Vc** | Verde claro | Alta |
| **A** | Amarillo | Media |
| **N** | Naranja | Baja |
| **R** | Rojo | La más baja |

El código se elige al crear o editar el piso, en la lista **Categoría de comisión** de cada medida (ordenada de la comisión más alta a la más baja). Es opcional: una medida sin código no muestra nada.

El mismo punto de color aparece en cada producto que agregas a una **cotización** o a una **venta**, junto al color y la medida, para saber cuánto descuento se puede dar antes de ajustar el precio. Como es un código de colores, el cliente no ve cuánto gana el vendedor aunque vea la pantalla.

### Editar un producto

El ícono de **lápiz** en la fila del producto abre el formulario de edición. Ahí se cambian los datos generales, las medidas, los precios, los colores, el stock y el stock mínimo. El stock también se puede corregir desde ahí (ver [Desde el formulario del producto](#desde-el-formulario-del-producto)).

Si algo no se puede guardar (por ejemplo, un cambio que el sistema no permite), el motivo aparece en un aviso rojo arriba del formulario.

### Pisos que se venden por pieza

Algunos pisos, como mosaicos o decorados, no se venden por caja ni por m², sino **por pieza**. Para registrarlos, en el formulario del piso elige **pieza** en la lista **Unidad**. El formulario cambia:

- El precio se captura como **Precio por pieza**.
- Desaparecen los datos que solo aplican a cajas: **PEI**, **ETT**, **Precio por m²**, **Piezas por caja**, **m² por caja**, **Kilos por caja** y **Cajas por tarima**.
- El stock de cada color se cuenta en **piezas**.

En el catálogo, estos pisos muestran su precio como **"$85.50/pieza"** y su stock como **"12 pzas"**. Las ventanas de ajuste e historial de stock también hablan de piezas.

En **cotizaciones y ventas** se captura directamente cuántas piezas lleva el cliente: no aparece el campo de **m² requeridos** y el total es piezas × precio por pieza. Al vender, se descuentan esas piezas del stock.

> La **Unidad** de un piso no se puede cambiar una vez que tiene colores registrados: la lista aparece deshabilitada con un aviso. Si un piso se registró con la unidad equivocada, hay que crearlo de nuevo con la unidad correcta.

### Capturar un piso con el teclado

El formulario del piso se puede llenar completo sin usar el mouse:

- Al abrir **Nuevo piso**, el cursor ya está en **Proveedor**: se puede empezar a capturar de inmediato.
- **Enter** avanza al siguiente campo, igual que **Tab** pero sin detenerse en los botones. **Shift + Tab** regresa al anterior. Enter ya no intenta guardar el piso a medio capturar.
- En las listas (Proveedor, Categoría, Unidad, PEI…), escribir la primera letra abre la lista y salta a la opción que empieza con ella; las **flechas** recorren la lista y **Enter** elige. Con la lista cerrada, Enter pasa al siguiente campo.
- Al pasar a un campo con Enter, su contenido queda seleccionado: lo que escribas lo reemplaza.
- En los colores, **Enter** en **Stock mínimo** de la última fila agrega un color nuevo y deja el cursor en él, como en una hoja de cálculo. Si esa fila todavía no tiene color, Enter pasa al siguiente campo sin agregar filas vacías.
- Al presionar **+ Agregar color**, el cursor pasa directo al campo **Color** de la fila nueva. Con **+ Agregar medida**, pasa a la **Medida** nueva.
- Al quitar un color o una medida, el cursor se queda en el color o la medida de al lado, para seguir capturando.
- Para guardar sin buscar el botón: **Ctrl + S** o **Ctrl + Enter** desde cualquier campo (en Mac, **⌘ + S** o **⌘ + Enter**). El atajo aparece como recordatorio junto al botón **Guardar**.
- Si al guardar falta algún dato, el cursor salta al primer campo marcado en rojo.
- Con **Tab** también se llega a los botones (**+**, **Quitar medida**, la **X** de cada color, **+ Agregar color**…). El botón donde está el cursor se marca con un contorno dorado y se presiona con **Enter** o **Espacio**.
- En las ventanas de confirmación el cursor ya está en un botón. Al **confirmar cambios de stock**, Enter guarda; al **eliminar un color**, Enter cancela (para no borrar por accidente) y hay que pasar con Tab a **Eliminar**. **Esc** cierra la ventana sin hacer nada.

---

## 3. Búsqueda y filtros

Arriba de la tabla hay herramientas para encontrar productos rápido:

- **Buscador**: en pisos busca por nombre de línea, color o código; en otros productos, por nombre o código. No importan los acentos ni las mayúsculas. Si buscas un color o un código, solo se muestran los colores que coinciden.
- **Categoría**: muestra solo los productos de una categoría.
- **Solo stock bajo** (solo en pisos): muestra únicamente los colores que necesitan resurtido.
- **Limpiar filtros**: aparece cuando hay algún filtro activo y los quita todos de una vez.

> Desde el **Dashboard**, al dar clic en una alerta de stock bajo, el catálogo se abre ya filtrado y desplegado en el producto que necesita atención.

---

## 4. Control de stock

Los pisos y los demás productos funcionan igual. El stock se puede cambiar de dos formas: con los íconos de la tabla del inventario o desde el formulario de edición del producto. La diferencia es que en pisos el stock se cuenta en **cajas** (o en **piezas**, si el piso se vende por pieza) y en otros productos en **unidades**.

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

### Desde el formulario del producto

Al editar un piso o un producto general, el campo **Stock actual** se puede modificar igual que el stock mínimo:

- **Cambiar el número** (por ejemplo, de 10 a 8) registra la diferencia como un ajuste: *quitar 2*.
- **Dejar el campo vacío** desactiva el seguimiento de stock.
- **Escribir un número en un producto *Sin control*** activa el seguimiento con esa cantidad.

Debajo del campo se ve el cambio que se hará (por ejemplo, *10 → 8 cj*). Al dar clic en **Guardar cambios** aparece un resumen de todos los cambios de stock para confirmarlos antes de guardar. Cada cambio queda en el historial igual que si se hiciera desde el inventario (*Ajuste manual*, *Stock inicial* o *Seguimiento desactivado*).

> Si se registra una venta del mismo producto mientras el formulario está abierto, el ajuste se aplica sobre el stock real. Por ejemplo, si había 10, se vendió 1 y cambias el campo a 8, se quitan 2 y quedan 7. Para un conteo físico exacto, recarga el formulario antes de corregir el stock.

---

## 5. Historial de stock

El ícono de **reloj (Ver historial de stock)** muestra todos los movimientos de un color o producto:

| Columna | Qué muestra |
| --- | --- |
| **Fecha** | Cuándo ocurrió el movimiento. |
| **Tipo** | **Entrada**, **Salida** o **Desactivado**. |
| **Cantidad** | Cuánto se agregó (+) o se quitó (−). |
| **Origen** | **Stock inicial**, **Ajuste manual**, **Seguimiento desactivado** o el **folio de la venta**. El folio es un enlace: al darle clic se abre el detalle de esa venta. |
| **Stock resultante** | Cuánto quedó después del movimiento. |

---

## 6. Otros productos

Funciona igual que el catálogo de pisos, pero más sencillo. Cada producto es una sola fila con su nombre, código, categoría, precio y stock en unidades. Desde la fila se puede:

- activar o ajustar el stock,
- ver el historial,
- editar el producto (lápiz).

Esta sección no tiene filtro de stock bajo, porque estos productos no manejan stock mínimo.

### Código del producto

A diferencia de los pisos, el código de estos productos **se captura a mano** en el formulario (por ejemplo, el código del proveedor):

- Es **opcional**. Los productos sin código muestran "—" en la tabla.
- No puede llevar espacios y **no se puede repetir**.
- Se guarda siempre en mayúsculas.

El código también sirve para buscar el producto en el inventario, en cotizaciones y en ventas.

---

## Registro de cambios

Mejoras que se van agregando al módulo:

| Fecha | Cambio |
| --- | --- |
| 2026-10-15 | **Catálogo de pisos**: ahora un clic en cualquier parte de la fila del producto abre o cierra sus medidas, no solo la flecha. |
| 2026-10-15 | **Catálogo de pisos**: los productos y las medidas se abren y cierran con una animación suave en lugar de aparecer de golpe. |
| 2026-10-15 | **Nuevo producto (pisos)**: la lista de categorías ya solo muestra las de tipo Pisos, no las de Otros productos. |
| 2026-10-15 | **Formularios**: títulos y descripciones distintos para pisos (*Nuevo piso* / *Editar piso*) y para otros productos (*Nuevo producto general* / *Editar producto general*), para que quede claro qué se está registrando. |
| 2026-10-15 | **Editar piso / producto general**: el stock se puede cambiar, activar o desactivar directamente en el formulario, con confirmación antes de guardar. |
| 2026-10-15 | **Historial de stock**: el folio de la venta en la columna Origen ahora lleva directo al detalle de la venta. |
| 2026-10-15 | **Nuevo piso / producto general**: botón **+** junto a la lista de categorías para crear una categoría nueva sin salir del formulario; queda seleccionada al guardarla. |
| 2026-10-15 | **Configuración → Categorías**: ahora se pueden eliminar categorías que no tengan productos. |
| 2026-10-15 | **Otros productos**: nuevo campo **Código** (opcional, capturado a mano) en el formulario, columna Código en la tabla y búsqueda por código en inventario, cotizaciones y ventas. |
| 2026-10-16 | **Configuración → Proveedores**: nueva pantalla para agregar, editar y eliminar proveedores. Solo se pueden eliminar los que no tengan productos. |
| 2026-10-16 | **Nuevo piso / Editar piso**: botón **+** junto a la lista de proveedores para crear uno nuevo sin salir del formulario; queda seleccionado al guardarlo. |
| 2026-10-16 | **Categorías y proveedores**: al guardar un nombre que ya existe, el aviso ahora dice claramente *"Ya existe una categoría con ese nombre."* o *"Ya existe un proveedor con ese nombre."* |
| 2026-10-16 | **Pisos por pieza**: los pisos con unidad **pieza** (mosaicos, decorados) se registran solo con precio por pieza, sin PEI, ETT ni datos de caja, y su stock se cuenta en piezas. |
| 2026-10-16 | **Catálogo de pisos**: los pisos por pieza muestran su precio como *"/pieza"* y su stock en *"pzas"*, también en las ventanas de ajuste e historial de stock. |
| 2026-10-16 | **Cotizaciones y ventas**: los pisos por pieza se cotizan y venden capturando el número de piezas, sin m² requeridos; el detalle y el PDF los muestran en piezas. |
| 2026-10-16 | **Editar piso**: la **Unidad** ya no se puede cambiar si el piso tiene colores registrados. |
| 2026-10-16 | **Editar piso**: cuando un cambio no se puede guardar, ahora se muestra el motivo en lugar de no pasar nada. |
| 2026-10-16 | **Códigos de comisión**: cinco códigos (Vo, Vc, A, N, R) del que más comisión deja al que menos. El catálogo los muestra con un punto de color junto al código, y la lista del formulario dice el nombre de cada uno (*"Vo · Verde oscuro"*). |
| 2026-10-16 | **Cotizaciones y ventas**: cada piso agregado muestra su código de comisión (punto de color y código) junto al color y la medida. |
| 2026-10-16 | **Nuevo piso / Editar piso**: captura con teclado más fluida. El cursor empieza en Proveedor, pasa solo al color o medida nuevos al agregarlos, no se pierde al quitarlos, y salta al primer campo con error al intentar guardar. |
| 2026-10-16 | **Nuevo piso / Editar piso**: **Enter** avanza al siguiente campo en lugar de intentar guardar, y en el último color agrega uno nuevo. |
| 2026-10-16 | **Nuevo piso / Editar piso**: atajo **Ctrl + S** (o **Ctrl + Enter**) para guardar desde cualquier campo. |
| 2026-10-16 | **Nuevo piso / Editar piso**: los botones muestran un contorno dorado cuando el cursor está en ellos, y las ventanas de confirmación ya se pueden contestar con Enter o Esc. |

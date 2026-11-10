# Reporte: cómo funciona el control de stock

Este reporte describe **qué hace** el control de stock de este sistema y **por qué** está diseñado así, para poder replicarlo en otro sistema con otra tecnología. No describe el código: describe las reglas, los flujos y las decisiones de diseño.

---

## 1. Resumen en una página

- El stock es un **número entero por artículo** (cada color de piso, o cada producto general).
- Un artículo puede **llevar control de stock o no**. "Sin control" no es lo mismo que "0 existencias".
- **Ningún cambio de stock ocurre sin dejar un movimiento en el historial.** Hay un único punto del sistema que cambia el stock, y siempre guarda el movimiento en la misma operación.
- El stock solo cambia por cuatro motivos: **stock inicial**, **ajuste manual**, **desactivar el seguimiento** y **pago de una cotización**.
- Las ventas descuentan stock **al marcar la cotización como pagada**, no al cotizar. Cotizar sin stock suficiente solo muestra un aviso.
- El pago es **todo o nada**: si un solo producto no alcanza, no se descuenta nada.
- El stock **nunca queda negativo**.
- Una cotización pagada ya **no se puede editar, cancelar ni eliminar**, porque su stock ya se descontó y el sistema no tiene un flujo para devolverlo.
- Los colores de piso tienen **stock mínimo** opcional. Al llegar a él o bajar, se marcan como **stock bajo** en el catálogo y en el dashboard.

---

## 2. Conceptos

### 2.1 Qué artículos llevan stock

| Artículo | Ejemplo | Unidad de stock |
| --- | --- | --- |
| **Color de un piso** (variante: producto → medida → color) | "Mármol Carrara 60X60, color Blanco" | **Cajas**, o **piezas** si el piso se vende por pieza |
| **Producto general** | Pegamento, boquilla, herramienta | **Unidades** |

**Por qué el stock vive en el color y no en el producto:** lo que se cuenta físicamente en bodega es una caja de un color y una medida concretos. Un "producto" (la línea) es solo una agrupación para el catálogo.

**Por qué la unidad de stock es la unidad física de almacén (caja) y no la de venta (m²):** los pisos se cotizan en m², pero se entregan en cajas completas. El sistema convierte los m² que pide el cliente a cajas completas al cotizar (cajas × m² por caja), y lo que se guarda y se descuenta son las cajas. Así el stock siempre coincide con lo que se puede contar en bodega.

### 2.2 Stock como entero

El stock siempre es un número entero. En productos generales se rechaza vender cantidades fraccionarias (por ejemplo 1.5 unidades).

**Por qué:** no se puede descontar media caja ni media unidad. Si el sistema aceptara decimales, el stock dejaría de coincidir con un conteo físico.

### 2.3 Tres estados posibles de un artículo

| Estado | Condición | Qué implica |
| --- | --- | --- |
| **Sin control** | El stock está **vacío** (no es un número) | No genera alertas, no bloquea ventas y no registra movimientos al venderse. |
| **OK** | Lleva control y el stock está **por arriba** del mínimo (o no tiene mínimo) | Se descuenta al vender. |
| **Stock bajo** | Lleva control, tiene mínimo y el stock es **menor o igual** al mínimo | Aparece en alertas. Sigue pudiéndose vender mientras haya existencias. |

**Por qué existe "Sin control" (y no se usa 0):** al principio el stock tenía 0 como valor por defecto. Eso causaba que un producto recién dado de alta, del que nadie había contado existencias, apareciera como "0 cajas" y bloqueara ventas. Se cambió a que un valor vacío signifique "no se lleva control", y 0 signifique "sí se lleva control y no hay nada". Además permite tener productos que el negocio no quiere contar (por ejemplo, artículos sobre pedido) sin que estorben.

### 2.4 Stock mínimo

- Solo los **colores de piso** tienen stock mínimo. Es opcional y se captura al editar el piso.
- Los productos generales **no** tienen stock mínimo, así que nunca aparecen como "stock bajo".
- La regla es **stock ≤ mínimo** (llegar al mínimo ya cuenta como bajo).
- Un artículo **sin control** nunca es "stock bajo", aunque tenga mínimo capturado.

**Por qué "≤" y no "<":** el mínimo se interpreta como "el punto en el que hay que volver a pedir". Si tienes exactamente el mínimo, ya es momento de reordenar.

---

## 3. El historial de movimientos (la pieza central)

### 3.1 Qué guarda cada movimiento

| Dato | Para qué sirve |
| --- | --- |
| **Artículo** | A qué color de piso **o** a qué producto general pertenece (exactamente uno de los dos, nunca ambos ni ninguno). |
| **Tipo** | **Entrada** (suma) o **Salida** (resta). |
| **Cantidad** | Siempre positiva. El tipo dice si suma o resta. |
| **Origen** | Por qué ocurrió (ver tabla siguiente). |
| **Cotización** | Solo si el origen es el pago de una cotización: cuál fue. |
| **Stock resultante** | Cuánto quedó **después** del movimiento. Vacío si el movimiento desactivó el seguimiento. |
| **Fecha** | Cuándo ocurrió. |

### 3.2 Orígenes posibles

| Origen | Tipo | Cuándo ocurre |
| --- | --- | --- |
| **Stock inicial** | Entrada | Se activa el control de un artículo que no lo tenía (al darlo de alta con stock o después). Puede ser de 0. |
| **Ajuste manual** | Entrada o salida | Un usuario agrega mercancía que llegó o quita mermas, roturas o diferencias de conteo. |
| **Seguimiento desactivado** | Salida | Se quita el control de stock. Retira exactamente lo que había y deja el artículo "Sin control". |
| **Pago de cotización** | Salida | Se marca una cotización como pagada. |

### 3.3 Reglas que el sistema hace cumplir siempre

Todas viven en **un único punto** que es el único autorizado a cambiar el stock. Ese punto cambia el número **y** guarda el movimiento **en la misma transacción**: o pasan las dos cosas o ninguna.

1. **No existe un cambio de stock sin su movimiento.** Ninguna otra parte del sistema puede escribir el stock directamente. Ni siquiera el formulario de edición del producto (ver sección 5).
2. **La cantidad es positiva.** La única excepción es 0, permitido solo en *stock inicial* (empezar a contar sin existencias) y en *desactivar* (desactivar un artículo que tenía 0).
3. **"Stock inicial" ocurre si y solo si el artículo no llevaba control.** No se puede registrar un inicial sobre un artículo que ya se cuenta, ni un ajuste manual o una salida sobre uno que no se cuenta.
4. **No se puede restar a un artículo sin control.**
5. **Desactivar retira exactamente el stock actual**, ni más ni menos. Así el historial guarda cuánto había en el momento de desactivar.
6. **Un movimiento lleva cotización si y solo si su origen es el pago de una cotización.**
7. **Un movimiento apunta exactamente a un artículo.**
8. **No hay stock negativo:** antes de cualquier salida se valida que haya suficiente. Esa validación la hace quien llama (el ajuste o el pago), porque cada uno necesita su propio mensaje de error.

**Por qué centralizarlo así:**

- **Auditoría:** el historial siempre explica el stock actual. Si alguien pregunta "¿por qué hay 7 cajas?", la respuesta está en los movimientos.
- **Confianza en el dato:** como el stock solo cambia por un camino, no hay forma de que un error en otra pantalla lo deje inconsistente.
- **Stock resultante guardado:** permite leer el historial como un estado de cuenta, sin recalcular sumas, y detectar a simple vista si algo no cuadra.

### 3.4 Historial visible para el usuario

Cada color de piso y cada producto general tiene un botón de **historial** que muestra todos sus movimientos, del más reciente al más antiguo:

| Columna | Qué muestra |
| --- | --- |
| Fecha | Cuándo ocurrió. |
| Tipo | **Entrada**, **Salida** o **Desactivado** (la desactivación se guarda como salida, pero se muestra aparte porque no es una salida real de mercancía). |
| Cantidad | `+N` o `−N`. |
| Origen | Stock inicial, Ajuste manual, Seguimiento desactivado, o el **folio de la cotización** como enlace a su detalle. |
| Stock resultante | Cuánto quedó. |

**Conservación del historial:** los productos y colores nunca se borran físicamente: se marcan como dados de baja. Las cotizaciones pagadas, que son las únicas con movimientos, no se pueden eliminar. Además, la base de datos impide borrar un artículo o una cotización que tenga movimientos. Así el historial nunca pierde a qué se refería un movimiento.

---

## 4. Funciones de control de stock

### 4.1 Activar el seguimiento

- **Qué hace:** a un artículo "Sin control" se le captura la cantidad que hay hoy (puede ser 0). Se registra como **stock inicial**.
- **Por qué es un movimiento y no solo un valor:** para que el historial empiece con un punto de partida conocido. Sin él, la primera línea del historial sería una entrada o salida sobre un número que no se sabe de dónde salió.
- **Al dar de alta un producto:** si se captura stock en el alta, se crea el artículo y su movimiento inicial en la misma operación. Si no se captura nada, el artículo queda "Sin control".

### 4.2 Ajustar el stock

- **Agregar:** para mercancía que llegó. Mínimo 1.
- **Quitar:** para mermas, piezas rotas o correcciones de conteo. Mínimo 1 y no más de lo que hay.
- Un ajuste de 0 sobre un artículo que ya se cuenta se rechaza porque no cambia nada.
- Si no hay suficiente, se responde con un mensaje claro: *"Stock insuficiente. Disponible: N cajas."*

**Nota:** en este sistema **no existe un módulo de compras ni de recepción de proveedor**. Las entradas de mercancía se registran como *ajuste manual → agregar*.

### 4.3 Desactivar el seguimiento

- **Qué hace:** registra una salida por todo el stock actual y deja el artículo "Sin control". Pide confirmación antes.
- **Se puede volver a activar** después, y en ese caso empieza con un nuevo *stock inicial*.
- **Por qué se registra como salida de todo el stock:** para que el historial diga cuánto había al desactivar, y para que la suma de movimientos siga cuadrando con el stock (que pasa a vacío).

### 4.4 Cambiar el stock desde el formulario de edición del producto

El formulario de edición muestra un campo **Stock actual** editable, por comodidad. Pero el sistema **no guarda ese número directamente**: lo traduce a un ajuste.

| Lo que hace el usuario en el campo | Lo que se envía |
| --- | --- |
| Cambia 10 por 8 | Ajuste: quitar 2 |
| Cambia 10 por 12 | Ajuste: agregar 2 |
| Lo deja vacío | Desactivar seguimiento |
| Escribe un número en un artículo "Sin control" | Activar seguimiento con ese número |
| No lo cambia | Nada |

Antes de guardar, se muestra un **resumen de todos los cambios de stock** (por ejemplo, *"10 → 8 cj"*) y el usuario debe confirmarlo.

**Por qué funciona así:**

- El formulario de edición del producto **ignora el stock** si se lo mandan directo. El único camino para cambiarlo es el ajuste, que siempre deja movimiento (regla 3.3.1).
- La confirmación existe porque cambiar un número en un formulario largo es fácil de hacer por error, y queda en el historial.

**Limitación conocida (por diseño):** el ajuste es **relativo** (la diferencia), no absoluto. Si mientras el formulario está abierto se paga una cotización de ese producto, el ajuste se aplica sobre el stock real. Ejemplo: había 10, se pagó 1 (quedan 9), el usuario cambia el campo de 10 a 8 → se quitan 2 → quedan 7, no 8. Para un conteo físico exacto se recomienda recargar el formulario antes. Si al aplicar no alcanza el stock, el resto del producto se guarda igual y se avisa qué ajustes de stock fallaron.

---

## 5. Cómo afectan las ventas (cotizaciones) al stock

En este sistema la venta es una **cotización** que pasa por estos estados: **Borrador → Pagada**, o **Borrador → Cancelada**.

> Antes existía un módulo de Punto de Venta que descontaba stock al vender. Se eliminó y el descuento se movió al pago de la cotización. Los movimientos antiguos de ventas se siguen mostrando en el historial, pero sin folio.

### 5.1 Al cotizar: solo un aviso

- Al elegir un producto, el buscador muestra su stock actual (*"Stock: 12 cajas"* o *"Sin control de stock"*).
- Si la cantidad cotizada supera el stock, la línea muestra un **aviso** de stock insuficiente, pero la cotización **sí se puede guardar**.
- Cotizar **no aparta ni reserva** stock.

**Por qué no bloquea ni reserva:** una cotización es una propuesta. El cliente puede tardar días en pagar o no pagar nunca, y en ese tiempo puede llegar mercancía. Bloquear o reservar al cotizar dejaría stock atrapado en cotizaciones que no se concretan. El momento en que el stock realmente sale es el pago.

### 5.2 Al marcar como pagada: descuento de stock

Este es el flujo más delicado del sistema. Pasos, en una sola transacción:

1. **Bloquear la cotización** y volver a leerla. Si ya está pagada, cancelada o en otro estado distinto de Borrador, se rechaza.
2. **Agrupar las líneas por artículo.** Si el mismo color aparece en dos líneas (3 cajas y 2 cajas), se suma: se necesitan 5.
3. **Bloquear cada artículo y validar todo antes de descontar nada:**
   - Si un artículo fue dado de baja → se rechaza el pago (*"la variante X ya no está disponible"*).
   - Si un artículo no tiene stock suficiente → se rechaza el pago (*"Stock insuficiente para X. Disponible: 3 cajas, se requieren 5"*).
   - Los artículos **sin control** siempre pasan esta validación.
4. **Descontar** cada artículo con control, registrando un movimiento **Pago de cotización** ligado a la cotización. Los artículos sin control **no** se descuentan ni generan movimiento.
5. **Marcar la cotización como Pagada**, guardando cuándo y quién la pagó.

Antes de llamar al servidor, la pantalla pide confirmación: *"Se descontará del inventario el stock de sus productos y ya no se podrá editar ni cancelar. Esta acción no se puede deshacer."*

**Por qué validar todo antes de descontar (todo o nada):** si se descontara línea por línea y la tercera fallara, quedarían dos productos descontados y una cotización sin pagar. Validar primero garantiza que el pago o pasa completo o no cambia nada.

**Por qué agrupar por artículo:** si se validara línea por línea, dos líneas de 3 cajas pasarían por separado contra un stock de 5, aunque juntas necesitan 6.

**Por qué bloquear (lock) los registros:** dos usuarios podrían pagar al mismo tiempo dos cotizaciones del mismo producto. Sin bloqueo, ambos verían 5 cajas, ambos validarían 4, y el stock quedaría en −3. Con bloqueo, el segundo espera a que el primero termine y ve el stock real. Lo mismo evita que la misma cotización se pague dos veces con doble clic: el segundo intento la encuentra ya pagada.

**Por qué bloquear en un orden fijo** (primero la cotización, luego los artículos ordenados por su identificador): si dos operaciones bloquean los mismos registros en distinto orden, pueden quedarse esperándose una a la otra para siempre (deadlock). Un orden fijo lo evita.

### 5.3 Después de pagada: inmutable

| Acción sobre una cotización pagada | ¿Se permite? | Por qué |
| --- | --- | --- |
| Editar | No | El stock se descontó según las líneas que tenía. Cambiarlas dejaría el descuento sin cuadrar. |
| Cancelar | No | Cancelar no regresa el stock. |
| Eliminar | No | Su stock ya se descontó y sus movimientos la referencian. |
| Pagar de nuevo | No | Descontaría el stock dos veces. |

Cancelar una cotización **en Borrador** no toca el stock, porque nunca se descontó.

**Importante:** el sistema **no tiene devoluciones**. Si hay que devolver mercancía de una cotización pagada, se hace con un ajuste manual de *agregar*.

### 5.4 Ventas por m² y por pieza

- **Pisos por caja:** el cliente pide m², el sistema calcula cajas completas, cobra los m² que cubren esas cajas y descuenta **cajas**. Si un color no tiene configurado cuántos m² trae su caja, no se puede cotizar (no habría forma de saber cuántas cajas descontar).
- **Pisos por pieza** (mosaicos, decorados): se captura el número de piezas y se descuentan **piezas**.
- **Productos generales:** se descuentan **unidades** enteras.

La **unidad de venta** de un piso (caja o pieza) **no se puede cambiar** una vez que tiene colores registrados, porque el stock ya capturado dejaría de significar lo mismo (10 cajas no son 10 piezas).

---

## 6. Alertas de stock bajo

### 6.1 En el catálogo

- Cada color muestra una etiqueta de estado: **OK**, **Stock bajo** o **Sin control**.
- Cada **producto** y cada **medida** muestran una etiqueta roja **"N con stock bajo"**, para saber dónde están los faltantes sin abrir todo.

### 6.2 En el dashboard

- Un recuadro **Stock bajo** lista todos los colores en stock bajo, con su stock actual y su mínimo.
- Los colores en **0** se destacan con más fuerza, porque son lo más urgente.
- Al dar clic en una alerta, abre el catálogo **en ese producto** (desplegado y resaltado), donde están el ajuste y el historial.

**Por qué el dashboard se calcula a partir de los mismos datos del catálogo** (y no con una consulta aparte): así, cuando se ajusta stock o se paga una cotización, la alerta se actualiza en el momento sin volver a consultar el servidor, y no puede haber diferencias entre lo que dice el catálogo y lo que dice el dashboard.

**Decisión de diseño:** había un filtro "Solo stock bajo" en el catálogo y se quitó, porque las etiquetas rojas ya señalan los faltantes y el dashboard ya da la lista completa.

---

## 7. Reparto de responsabilidades entre pantalla y servidor

| Responsabilidad | Pantalla (front) | Servidor (back) |
| --- | --- | --- |
| Validar cantidades (entero, mínimo 1, o 0 al activar) | Sí, para dar retroalimentación inmediata | Sí, es la que cuenta |
| Avisar de stock insuficiente al cotizar | Sí (solo aviso) | — |
| Rechazar salidas sin stock suficiente | — | Sí, siempre |
| Traducir "nuevo valor" del formulario a ajuste | Sí | — |
| Cambiar el stock y registrar el movimiento | — | Sí, único punto |
| Calcular "stock bajo" | Replica la regla para actualizar al instante | Sí, es la fuente de verdad |
| Bloqueos y transacciones | — | Sí |

**Principio:** la pantalla **nunca decide**; solo anticipa para que el usuario no espere un error. El servidor vuelve a validar todo. Tras cada operación, la pantalla actualiza su copia local con la **respuesta del servidor** (el stock real resultante), no con su propio cálculo, salvo en el pago, donde replica la misma regla del servidor para refrescar catálogo y alertas sin recargar.

---

## 8. Lo que este sistema NO tiene (para considerar en el nuevo)

Estas ausencias son decisiones del alcance actual, no necesariamente errores. Vale la pena decidir conscientemente si el nuevo sistema las necesita:

| Ausencia | Consecuencia hoy | Sugerencia |
| --- | --- | --- |
| **Usuario en cada movimiento** | El historial dice qué y cuándo, pero no quién hizo un ajuste manual (el pago sí guarda quién pagó la cotización). | Guardar el usuario en cada movimiento. Es barato y muy útil para auditoría. |
| **Motivo o nota en ajustes manuales** | "Quitar 3" no dice si fue merma, rotura o conteo. | Agregar un motivo (lista corta) o nota libre. |
| **Compras / recepción de proveedor** | Las entradas son ajustes manuales sin documento de respaldo. | Un origen "Compra" ligado a una orden o factura del proveedor. |
| **Devoluciones** | Una cotización pagada no se puede revertir; se corrige con ajuste manual. | Un origen "Devolución" ligado a la venta original. |
| **Reservas / apartados** | Dos cotizaciones pueden prometer el mismo stock; la primera que se paga gana. | Solo si el negocio lo necesita: agrega mucha complejidad. |
| **Varios almacenes o sucursales** | Un solo número de stock por artículo. | Si hay más de una ubicación, el stock y los movimientos deben llevar almacén desde el inicio. |
| **Stock mínimo en productos generales** | Nunca generan alerta. | Extender el mínimo a todos los artículos si se necesita. |
| **Paginación del historial** | El historial se carga completo. | Paginar cuando un artículo acumule muchos movimientos. |
| **Restricción en base de datos de "un solo artículo por movimiento"** | Solo la valida la aplicación. | Si el motor de base de datos lo permite, agregar una restricción (CHECK). |

---

## 9. Lista para replicarlo

Requisitos mínimos para obtener el mismo comportamiento en otro sistema:

1. **Stock por artículo físico**, entero, que pueda estar vacío ("sin control"), distinto de 0.
2. **Tabla de movimientos** con: artículo, tipo (entrada/salida), cantidad positiva, origen, documento relacionado (si aplica), stock resultante y fecha. Idealmente también usuario y motivo.
3. **Una sola función/servicio** que cambie el stock, aplique las reglas de la sección 3.3 y registre el movimiento en la misma transacción. Nada más escribe el stock.
4. **Alta de producto con stock** = crear artículo + movimiento inicial, en la misma transacción.
5. **Edición de producto** que no acepte el stock directo; si la pantalla lo permite editar, que lo traduzca a ajustes y pida confirmación.
6. **Ajuste manual**: agregar, quitar (sin quedar negativo), activar y desactivar seguimiento.
7. **Venta**: el descuento ocurre en un solo momento (en este sistema, el pago). Agrupar por artículo, bloquear registros en orden fijo, validar todo y luego descontar todo. Rechazar artículos dados de baja.
8. **Documento de venta inmutable** una vez descontado el stock (o un flujo de devolución que genere su propio movimiento de entrada).
9. **Stock mínimo** con regla `stock ≤ mínimo`, ignorando artículos sin control, mostrado en el catálogo y en un resumen de alertas.
10. **Historial consultable** por artículo, del más reciente al más antiguo, con enlace al documento que originó cada movimiento.
11. **Borrado lógico** (dar de baja) de artículos y documentos que tengan movimientos, para no perder el historial.
12. **Unidad de stock fija** por artículo una vez que tiene existencias, y conversión de la unidad de venta (m²) a la unidad de stock (cajas completas) antes de guardar la venta.

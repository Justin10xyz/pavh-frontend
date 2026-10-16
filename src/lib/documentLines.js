// Reglas de las líneas de producto de un documento (cotización o venta),
// compartidas por QuoteFormView.vue y SaleFormView.vue. Solo funciones puras:
// lo que depende de stores (si la variante es por pieza, el producto simple
// "en vivo", el stock actual) lo resuelve la vista y llega como argumento.

import { boxesForSquareMeters, squareMetersForBoxes } from "@/lib/boxes";
import { formatQuantity } from "@/lib/formatQuantity";
import { variantStockUnit } from "@/lib/unitTypes";

// Una línea lleva `variant` O `simpleProduct`, nunca ambos — refleja el arco
// exclusivo product_variant_id / simple_product_id del backend.
// `quantity` va en la unidad física de stock: cajas completas (variante), piezas
// (variante por pieza) o unidades (simple). `requestedM2` es solo ayuda de
// captura para variantes por caja; no se envía. `fields` agrega lo propio de
// cada documento (ej. `unit_price` en venta).
export function createEmptyLine(fields = {}) {
    return {
        id: crypto.randomUUID(),
        variant: null,
        simpleProduct: null,
        quantity: null,
        requestedM2: null,
        ...fields,
    };
}

export function hasProduct(line) {
    return !!(line.variant || line.simpleProduct);
}

// Lo que cuenta como cambio sin guardar: solo lo que se envía al backend. Una
// línea vacía agregada y sin usar no es un cambio.
export function serializeLines(lines, { withPrice = false } = {}) {
    return lines
        .filter(hasProduct)
        .map((line) => [
            line.variant?.id ?? null,
            line.simpleProduct?.id ?? null,
            line.quantity ?? null,
            ...(withPrice ? [line.unit_price ?? null] : []),
        ]);
}

// Producto + cantidad de un item del payload. Variante: cajas o piezas (los m²
// los deriva el backend). Simple: unidades.
export function lineItemPayload(line) {
    return line.simpleProduct
        ? { simple_product_id: line.simpleProduct.id, quantity: line.quantity }
        : { product_variant_id: line.variant.id, boxes: line.quantity };
}

// Línea que ya tiene el producto elegido (variante o simple), para fusionar en
// vez de duplicar la fila. Los ids de variante y de producto simple son de
// tablas distintas, por eso se compara solo contra el campo del mismo tipo.
export function findLineForProduct(lines, option) {
    const isSimple = option.type === "simple";
    return lines.find((line) =>
        isSimple ? line.simpleProduct?.id === option.id : line.variant?.id === option.id,
    );
}

// Sufijo de la cantidad de una línea de variante: piezas o cajas.
export function lineUnit(isPiece) {
    return variantStockUnit(isPiece ? "pieza" : null).short;
}

// La cantidad de una línea de variante por caja son sus cajas; estos son los m²
// que cubren, sobre los que se cobra el precio por m². Null en variantes por
// pieza (no derivan m²).
export function coveredM2(line, isPiece) {
    if (isPiece) return null;
    return squareMetersForBoxes(line.quantity || 0, line.variant?.m2_per_box);
}

// Solo UX: las cajas se pueden bajar a mano por debajo de lo requerido, y se avisa.
export function coversRequested(line, isPiece) {
    if (!(line.requestedM2 > 0)) return true;
    const covered = coveredM2(line, isPiece);
    return covered === null || covered >= line.requestedM2;
}

// Los m² requeridos sugieren las cajas (hacia arriba); borrarlos no toca las
// cajas ya capturadas.
export function applyRequestedM2(line, value) {
    line.requestedM2 = value;
    const boxes = value > 0 ? boxesForSquareMeters(value, line.variant?.m2_per_box) : null;
    if (boxes) line.quantity = boxes;
}

// Sin m2_per_box no se sabe qué cubren las cajas: el backend rechaza la línea
// (nunca asume 1:1). Se avisa desde que se elige, no hasta guardar. No aplica a
// variantes por pieza, que no derivan m². `action`: "cotizar", "vender".
export function boxConversionError(line, isPiece, action) {
    if (!line.variant || isPiece || Number(line.variant.m2_per_box) > 0) return "";
    return `Esta variante no tiene m² por caja configurado; no se puede ${action}.`;
}

// Precio de lista por m² (variante por caja), por pieza (variante por pieza,
// price_per_box) o por unidad (simple). `simpleProduct` es el producto simple
// "en vivo" que resuelve la vista.
export function listPrice(line, isPiece, simpleProduct) {
    if (!line.variant) return Number(simpleProduct.price) || 0;
    return Number(isPiece ? line.variant.price_per_box : line.variant.price_per_m2) || 0;
}

// Precio de una caja completa a `pricePerM2` (lo que vale cada caja que se
// entrega). Null en productos simples, variantes por pieza o sin m2_per_box.
export function boxPrice(line, isPiece, pricePerM2) {
    if (!line.variant || isPiece) return null;
    const m2PerBox = squareMetersForBoxes(1, line.variant.m2_per_box);
    if (m2PerBox === null) return null;
    return Math.round(m2PerBox * (Number(pricePerM2) || 0) * 100) / 100;
}

// Mismo cálculo que el backend (QuoteController@syncItems, SaleController@store):
// variante por caja, precio por m² sobre los m² que cubren las cajas; variante
// por pieza y simple, cantidad × precio.
export function lineSubtotal(line, isPiece, unitPrice) {
    if (!hasProduct(line) || !line.quantity || !unitPrice) return 0;
    if (line.variant && !isPiece) return (coveredM2(line, isPiece) ?? 0) * unitPrice;
    return line.quantity * unitPrice;
}

// Mensaje de una línea con producto y sin cantidad; "" si no aplica.
export function missingQuantityMessage(line, isPiece) {
    if (!hasProduct(line) || line.quantity > 0) return "";
    if (!line.variant) return "Captura la cantidad.";
    return isPiece ? "Captura las piezas." : "Captura las cajas.";
}

// null = el producto no lleva control de stock; undefined (el dato no vino en la
// respuesta) se trata igual porque no hay contra qué comparar.
export function toStock(value) {
    return value === null || value === undefined ? null : Number(value);
}

// Solo UX: el guard real es hasSufficientStock() de ProductVariant/SimpleProduct
// en el backend. `stock` ya normalizado con toStock().
export function exceedsStock(line, stock) {
    if (stock === null) return false;
    return (line.quantity || 0) > stock;
}

// Mismo texto base en cotización (aviso) y venta (error). `verb`: "cotizan",
// "requieren"; `consequence`: la oración final propia de cada documento.
export function stockShortageMessage(line, stock, isPiece, { verb, consequence }) {
    if (stock === null) return "";

    if (line.simpleProduct) {
        return `Stock insuficiente: hay ${formatQuantity(stock)} uds. y se ${verb} ${formatQuantity(line.quantity)}. ${consequence}`;
    }

    const unit = isPiece ? (stock === 1 ? "pieza" : "piezas") : stock === 1 ? "caja" : "cajas";
    return `Stock insuficiente: hay ${stock} ${unit} y se ${verb} ${line.quantity}. ${consequence}`;
}

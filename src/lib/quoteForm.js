// Lógica pura del form de cotización (QuoteFormView.vue). Las reglas de las
// líneas compartidas con venta viven en lib/documentLines.js y las de pago en
// lib/quotePayment.js.

import { createEmptyLine } from "@/lib/documentLines";

// Item de una cotización guardada (QuoteItemResource) → línea del form, para
// editarla. Se mapea product.name → lineName para que la variante tenga la
// misma forma que las que emite ProductAutocomplete y el template no distinga
// entre modos. Cada item trae variante O producto simple (arco exclusivo del
// backend).
export function quoteItemToLine(item) {
    return {
        ...createEmptyLine(),
        variant: item.product_variant
            ? {
                ...item.product_variant,
                type: "variant",
                lineName: item.product_variant.product?.name,
            }
            : null,
        simpleProduct: item.simple_product ? { ...item.simple_product, type: "simple" } : null,
        // Variante: sus cajas (null en líneas previas al cambio a cajas sin
        // m2_per_box; se piden al guardar). Los m² requeridos no se guardan.
        quantity: item.product_variant_id ? item.boxes : Number(item.quantity),
        priceType: item.price_type ?? "retail",
    };
}

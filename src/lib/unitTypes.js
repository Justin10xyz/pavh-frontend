// Unidad de venta de un piso (catálogo unit_types). Mismo criterio que el
// backend (Product::isSoldByPiece()): "pieza" = mosaicos/decorados que se venden
// por pieza a price_per_box, sin m², PEI/ETT ni datos de logística por caja.
// Cualquier otra unidad (hoy "m2") es el piso normal por caja.

export const PIECE_UNIT_TYPE_NAME = "pieza";

export function isSoldByPiece(unitTypeName) {
    return unitTypeName === PIECE_UNIT_TYPE_NAME;
}

// Ids de las variantes que se venden por pieza. Las variantes de una línea de
// cotización/venta no traen su unidad (vive en el producto): se resuelve contra
// los productos de Inventario, de donde salen las del buscador y las de /convert.
export function pieceVariantIds(products) {
    return new Set(
        products
            .filter((product) => isSoldByPiece(product.unit_type))
            .flatMap((product) => (product.variants ?? []).map((variant) => variant.id)),
    );
}

// Unidad del stock de una variante: piezas en pisos por pieza, cajas en los demás.
export function variantStockUnit(unitTypeName) {
    return isSoldByPiece(unitTypeName)
        ? { short: "pzas", label: "piezas" }
        : { short: "cj", label: "cajas" };
}

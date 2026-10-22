// Estado y reglas del formulario de producto de pisos (ProductFormView.vue y sus
// subcomponentes). Solo funciones puras: las peticiones y la confirmación de
// acciones se quedan en la vista.

import { groupVariants } from "@/lib/groupVariants";
import { describeStockChange, stockChangePayload } from "@/lib/stockChange";

// Catálogo cerrado de PEI, igual que ProductVariant::PEI_VALUES en el backend:
// romano simple o rango de dos niveles consecutivos, ordenado por nivel.
export const PEI_OPTIONS = ["I", "I/II", "II", "II/III", "III", "III/IV", "IV", "IV/V", "V"];

// El formulario elige el PEI en dos pasos: un nivel principal y, opcionalmente, un
// vecino con el que forma rango. El valor que viaja sigue siendo uno de PEI_OPTIONS.
export const PEI_LEVELS = ["I", "II", "III", "IV", "V"];

// Niveles con los que `level` puede formar rango (I solo con II, V solo con IV).
// Un valor fuera del catálogo no tiene vecinos.
export function peiNeighbors(level) {
    const index = PEI_LEVELS.indexOf(level);
    if (index === -1) return [];
    return [PEI_LEVELS[index - 1], PEI_LEVELS[index + 1]].filter(Boolean);
}

// "III/IV" → { base: "III", range: "IV" } (el menor como principal). Un nivel solo, un
// vacío o un valor fuera del catálogo quedan enteros en `base`, sin rango.
export function splitPei(pei) {
    if (PEI_OPTIONS.includes(pei) && pei.includes("/")) {
        const [base, range] = pei.split("/");
        return { base, range };
    }
    return { base: pei ?? "", range: "" };
}

// Inversa de splitPei: el rango siempre del menor al mayor ("III/IV", nunca "IV/III").
export function composePei(base, range) {
    if (!range) return base;
    return [base, range].sort((a, b) => PEI_LEVELS.indexOf(a) - PEI_LEVELS.indexOf(b)).join("/");
}

// Texto de Caras en encabezados de medida: 0 = la caja es pareja. Vacío/null
// devuelve "" (no se muestra badge).
export function formatFaceCount(faceCount) {
    if (faceCount === null || faceCount === undefined || faceCount === "") return "";
    const count = Number(faceCount);
    if (count === 0) return "Sin variación";
    return `${count} ${count === 1 ? "cara" : "caras"}`;
}

// Campos de variante que no aplican a pisos por pieza: no se muestran, no se
// validan y no viajan en el payload (el backend rechaza los de m²/PEI/ETT).
export const PIECE_EXCLUDED_VARIANT_FIELDS = [
    "pei",
    "ett",
    "price_per_m2",
    "m2_per_box",
    "kilos_per_box",
    "boxes_per_pallet",
    "pieces_per_box",
];

// Cada fila se convierte en su propia variante (POST/PUT /api/product-variants). `id` es
// solo la key local para el v-for; `variantId` es el id real en backend (null si la fila
// es nueva en esta sesión de edición) y decide POST vs. PUT al guardar.
// `originalStock` es el stock con el que se cargó la variante: contra él se
// calcula el ajuste al guardar.
export function createColorRow({
    variantId = null,
    color = "",
    stock_boxes = null,
    minimum_stock = null,
} = {}) {
    return {
        id: crypto.randomUUID(),
        variantId,
        color,
        stock_boxes,
        originalStock: stock_boxes,
        minimum_stock,
        errors: { color: "", stock_boxes: "", minimum_stock: "" },
    };
}

// Un grupo = una medida del producto: su ficha técnica (`spec`) + los colores que la
// comparten. Mismo criterio de agrupamiento que groupVariants.js / InventoryTable.vue,
// así que en edición el form muestra exactamente los grupos que se ven en Inventario.
// En creación se arranca con un solo grupo vacío.
const SPEC_FIELDS = [
    "size",
    "pei",
    "ett",
    "face_count",
    "kilos_per_box",
    "boxes_per_pallet",
    "commission_category_id",
    "price_per_box",
    "price_per_m2",
    "pieces_per_box",
    "m2_per_box",
];

export function createVariantGroup({ spec = {}, colorRows = [createColorRow()] } = {}) {
    return {
        id: crypto.randomUUID(),
        spec: {
            size: "",
            pei: "",
            ett: "",
            face_count: null,
            kilos_per_box: null,
            boxes_per_pallet: null,
            commission_category_id: "",
            price_per_box: null,
            price_per_m2: null,
            pieces_per_box: null,
            m2_per_box: null,
            ...spec,
        },
        specErrors: Object.fromEntries(SPEC_FIELDS.map((field) => [field, ""])),
        colorRows,
    };
}

// Agrupa las variantes con groupVariants.js (medida+PEI+ETT+caras+categoría de
// comisión+precio por caja). Los campos que no son parte de la llave (piezas, m², kg, cajas por
// tarima, precio por m²) se toman de la primera variante del grupo, igual que el
// encabezado de cada medida en InventoryTable.vue. Sin variantes devuelve [].
export function variantGroupsFromProduct(product) {
    return groupVariants(product.variants ?? []).map((group) =>
        createVariantGroup({
            spec: {
                size: group.size,
                pei: group.pei,
                // El backend lo manda como entero; el input de ETT es de texto
                // (igual que al capturarlo en un producto nuevo).
                ett: group.ett === null ? "" : String(group.ett),
                face_count: group.face_count ?? null,
                kilos_per_box: group.kilos_per_box,
                boxes_per_pallet: group.boxes_per_pallet,
                commission_category_id: group.commission_category?.id ?? "",
                price_per_box: group.price_per_box,
                price_per_m2: group.price_per_m2,
                pieces_per_box: group.pieces_per_box,
                m2_per_box: group.m2_per_box,
            },
            colorRows: group.variants.map((v) =>
                createColorRow({
                    variantId: v.id,
                    color: v.color,
                    stock_boxes: v.stock_boxes,
                    minimum_stock: v.minimum_stock,
                }),
            ),
        }),
    );
}

const REQUIRED_VARIANT_FIELDS = ["size", "price_per_box", "price_per_m2", "pieces_per_box", "m2_per_box"];
const REQUIRED_COLOR_ROW_FIELDS = ["color"];

function isEmpty(value) {
    return value === "" || value === null;
}

// Marca en `specErrors`/`errors` de cada grupo y fila lo que falta. Devuelve si
// todo es válido.
export function validateVariantGroups(groups, soldByPiece) {
    let isValid = true;

    const variantFields = soldByPiece
        ? REQUIRED_VARIANT_FIELDS.filter((field) => !PIECE_EXCLUDED_VARIANT_FIELDS.includes(field))
        : REQUIRED_VARIANT_FIELDS;

    for (const group of groups) {
        // Errores que quedaron de antes de cambiar la Unidad a pieza, en campos ya ocultos.
        if (soldByPiece) {
            for (const field of PIECE_EXCLUDED_VARIANT_FIELDS) group.specErrors[field] = "";
        }

        for (const field of variantFields) {
            group.specErrors[field] = "";
            if (isEmpty(group.spec[field])) {
                group.specErrors[field] = "Este campo es requerido";
                isValid = false;
            }
        }

        for (const row of group.colorRows) {
            for (const field of REQUIRED_COLOR_ROW_FIELDS) {
                row.errors[field] = "";
                if (isEmpty(row[field])) {
                    row.errors[field] = "Este campo es requerido";
                    isValid = false;
                }
            }
        }
    }

    return isValid;
}

// Si la medida quedó con algún error tras validateVariantGroups: en el acordeón
// del form se abre antes de llevar el foco al primer campo con error.
export function groupHasErrors(group) {
    return (
        Object.values(group.specErrors).some(Boolean) ||
        group.colorRows.some((row) => Object.values(row.errors).some(Boolean))
    );
}

// 422 de POST/PUT /api/product-variants: cada error va bajo su campo, en la ficha
// del grupo o en la fila del color. Devuelve si aplicó alguno.
export function applyVariantServerErrors(group, row, serverErrors = {}) {
    let applied = false;
    for (const [field, messages] of Object.entries(serverErrors)) {
        const target = field in group.specErrors ? group.specErrors : field in row.errors ? row.errors : null;
        if (target) {
            target[field] = messages[0];
            applied = true;
        }
    }
    return applied;
}

// Cada variante toma la ficha técnica de su propio grupo. `stock_boxes` solo va al
// crear (stock inicial): en una variante existente el backend lo ignora en el
// update, y el cambio viaja aparte como ajuste (ver pendingStockChanges).
// Vacío viaja como null: la variante queda sin control de stock.
export function buildVariantPayload(productId, group, row, soldByPiece) {
    const { spec } = group;
    const payload = {
        product_id: productId,
        size: spec.size,
        pei: spec.pei,
        ett: spec.ett,
        face_count: spec.face_count,
        kilos_per_box: spec.kilos_per_box,
        boxes_per_pallet: spec.boxes_per_pallet,
        commission_category_id: spec.commission_category_id || null,
        price_per_box: spec.price_per_box,
        price_per_m2: spec.price_per_m2,
        pieces_per_box: spec.pieces_per_box,
        m2_per_box: spec.m2_per_box,
        color: row.color,
        minimum_stock: row.minimum_stock,
    };

    if (!row.variantId) payload.stock_boxes = row.stock_boxes;

    // Pisos por pieza: los campos que no aplican ni siquiera viajan como null.
    if (soldByPiece) {
        for (const field of PIECE_EXCLUDED_VARIANT_FIELDS) delete payload[field];
    }

    return payload;
}

// Cambios de stock en variantes existentes, con lo que se muestra al confirmar.
export function pendingStockChanges(groups, unitShort) {
    return groups.flatMap((group) =>
        group.colorRows
            .filter((row) => row.variantId)
            .map((row) => ({ row, payload: stockChangePayload(row.originalStock, row.stock_boxes) }))
            .filter(({ payload }) => payload)
            .map(({ row, payload }) => ({
                row,
                payload,
                label: `${group.spec.size} · ${row.color}`,
                description: describeStockChange(row.originalStock, row.stock_boxes, unitShort),
            })),
    );
}

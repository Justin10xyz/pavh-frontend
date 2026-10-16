// Códigos de comisión del vendedor (catálogo commission_categories). El nivel
// (`tier`) viene del backend: 1 = la que más comisión deja (Verde oscuro), 5 = la
// que menos (Rojo). El color sale del nivel, nunca del código, para que renombrar
// un código no rompa nada.

// Clases completas (no armadas con template string) para que Tailwind las detecte.
const TIER_DOT_CLASSES = {
    1: "bg-commission-1",
    2: "bg-commission-2",
    3: "bg-commission-3",
    4: "bg-commission-4",
    5: "bg-commission-5",
};

// Sin nivel (o uno fuera de la escala): punto neutro.
export function commissionDotClass(tier) {
    return TIER_DOT_CLASSES[tier] ?? "bg-text-muted/40";
}

// "Vo · Verde oscuro", o solo el código si no tiene nombre.
export function commissionLabel(category) {
    return category.name ? `${category.code} · ${category.name}` : category.code;
}

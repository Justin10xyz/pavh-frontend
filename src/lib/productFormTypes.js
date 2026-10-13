// Tipo de formulario de producto de una categoría (categories.product_form_type).
// Compartido entre el diálogo de categoría (select) y el listado de categorías
// (columna Tipo) para que ambos nombren igual cada tipo.

// Mismo default que el backend.
export const DEFAULT_PRODUCT_FORM_TYPE = "variant";

export const PRODUCT_FORM_TYPE_OPTIONS = [
	{ value: "variant", label: "Pisos (con variantes)", shortLabel: "Pisos" },
	{ value: "simple", label: "General (nombre, precio, descripción)", shortLabel: "General" },
];

// Nombre corto para tablas; si llega un valor desconocido se muestra tal cual.
export function productFormTypeShortLabel(value) {
	return PRODUCT_FORM_TYPE_OPTIONS.find((option) => option.value === value)?.shortLabel ?? value;
}

// Stock editable en los formularios de producto (pisos y productos simples).
// El backend solo cambia el stock vía PATCH .../stock (add/subtract/deactivate,
// cada uno deja historial), así que el form compara el valor con el que se
// cargó y lo traduce a esa acción al guardar. `null` = sin control de stock.

// Grupo del ConfirmDialog que lista los cambios de stock antes de guardar
// (StockChangesConfirmDialog.vue).
export const STOCK_CHANGES_CONFIRM_GROUP = "stock-changes";

function normalize(value) {
	return value === undefined || value === "" ? null : value;
}

// Body para PATCH .../stock, o null si el stock no cambió. Escribir un número
// en un producto sin control activa el seguimiento (0 es válido); vaciar el
// campo de uno con control lo desactiva.
export function stockChangePayload(original, next) {
	const was = normalize(original);
	const now = normalize(next);

	if (was === now) return null;
	if (now === null) return { type: "deactivate" };
	if (was === null) return { type: "add", quantity: now };
	return now > was
		? { type: "add", quantity: now - was }
		: { type: "subtract", quantity: was - now };
}

export function describeStockChange(original, next, unit) {
	const was = normalize(original);
	const now = normalize(next);

	if (now === null) return `Se desactivará el seguimiento (tenía ${was} ${unit})`;
	if (was === null) return `Se activará el seguimiento con ${now} ${unit}`;
	return `${was} → ${now} ${unit}`;
}

// Pide confirmación con la lista de cambios (`[{ label, description }]`) y
// resuelve true solo si se acepta; cerrar el diálogo cuenta como cancelar.
export function confirmStockChanges(confirm, changes) {
	return new Promise((resolve) => {
		confirm.require({
			group: STOCK_CHANGES_CONFIRM_GROUP,
			header: "Confirmar cambios de stock",
			message: "Estos ajustes quedarán registrados en el historial de stock.",
			changes,
			accept: () => resolve(true),
			reject: () => resolve(false),
			onHide: () => resolve(false),
		});
	});
}

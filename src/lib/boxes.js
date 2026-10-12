// Las variantes se venden por caja completa: la cantidad real de una línea son
// sus cajas, y los m² son lo que esas cajas cubren (mismo cálculo que
// ProductVariant::squareMetersForBoxes() en el backend). Ambas funciones
// devuelven null si la variante no tiene m2_per_box — nunca se asume 1:1.

// Cajas necesarias para cubrir `squareMeters` (hacia arriba: no se entrega
// media caja). El redondeo previo evita que un error de punto flotante
// (ej. 5.76 / 1.44 = 4.0000000001) sume una caja de más.
export function boxesForSquareMeters(squareMeters, m2PerBox) {
	const perBox = Number(m2PerBox)
	if (!perBox) return null
	return Math.ceil(Number((Number(squareMeters) / perBox).toFixed(6)))
}

// m² que cubren `boxes` cajas, con los mismos 3 decimales que guarda el backend.
export function squareMetersForBoxes(boxes, m2PerBox) {
	const perBox = Number(m2PerBox)
	if (!perBox) return null
	return Math.round(Number(boxes) * perBox * 1000) / 1000
}

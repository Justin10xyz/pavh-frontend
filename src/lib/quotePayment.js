// Forma de pago y totales de una cotización. Las fórmulas replican las de
// QuoteController::totalFor() y Quote::balance() del backend; el backend
// recalcula todo al guardar, esto solo es el preview del form.

export const PAYMENT_TERMS = [
    { key: 'cash', label: 'Contado' },
    { key: 'credit', label: 'Crédito' },
]

export function paymentTermsLabel(paymentTerms) {
    return PAYMENT_TERMS.find((option) => option.key === paymentTerms)?.label ?? 'Contado'
}

function round2(value) {
    return Math.round(value * 100) / 100
}

// Descuento/envío/anticipo vacíos (null) cuentan como 0, igual que en el backend.
// Total = subtotal − descuento + envío; saldo = total − anticipo. El saldo puede
// salir negativo a propósito (anticipo mayor al total): no es un error.
export function quoteTotals({ subtotal, discount, shippingCost, downPayment }) {
    const total = round2(Number(subtotal) - (Number(discount) || 0) + (Number(shippingCost) || 0))
    const balance = round2(total - (Number(downPayment) || 0))
    return { total, balance }
}

// Mismo guard que QuoteController::discountRejectionMessage(): se compara
// contra subtotal − descuento, no contra el total (el envío no "tapa" un
// descuento mayor que el subtotal).
export function discountExceedsSubtotal(subtotal, discount) {
    return round2(Number(subtotal) - (Number(discount) || 0)) < 0
}

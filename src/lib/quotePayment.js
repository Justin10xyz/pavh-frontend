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

// Monto opcional tal como se envía: vacío → null, string decimal → número.
function toAmount(value) {
    return value === null || value === '' ? null : Number(value)
}

// Campos de pago del form tal como se envían; también entran a la foto de
// cambios sin guardar. De contado el vencimiento va siempre en null.
export function paymentPayload(form) {
    return {
        discount: toAmount(form.discount),
        shipping_cost: toAmount(form.shipping_cost),
        down_payment: toAmount(form.down_payment),
        payment_terms: form.payment_terms,
        credit_due_date: form.payment_terms === 'credit' ? form.credit_due_date || null : null,
    }
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

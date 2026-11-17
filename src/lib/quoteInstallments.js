// Abonos de una cotización: pagos parciales que se restan de su saldo. Mismas
// reglas que Quote::installmentBlockedMessage() y QuoteInstallmentController
// del backend, solo como UX: el backend las vuelve a validar.

export const INSTALLMENT_NOTES_MAX = 255

// Fecha LOCAL de hoy como "YYYY-MM-DD", para el valor por defecto y el máximo
// del input de fecha. No toISOString(): da la fecha en UTC, y en México desde
// las 18:00 ya sería "mañana" (el backend la rechaza por futura).
export function localToday(now = new Date()) {
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Registrar o anular abonos: solo en Borrador y sin pagar.
export function canManageInstallments(quote) {
    return !!quote && quote.status === 'Borrador' && !quote.paid_at
}

// Registrar además necesita saldo pendiente (el backend rechaza con saldo ≤ 0).
export function canRegisterInstallment(quote) {
    return canManageInstallments(quote) && Number(quote.balance) > 0
}

// Sin abonos y sin poder registrarlos (pagada o cancelada) la card no aporta nada.
export function showsInstallmentsCard(quote) {
    return (quote?.installments?.length ?? 0) > 0 || canManageInstallments(quote)
}

// Mismo orden que la relación Quote::installments() del backend: por fecha de
// pago y, en la misma fecha, por id. "YYYY-MM-DD" se compara bien como texto.
export function sortInstallments(installments) {
    return [...installments].sort(
        (a, b) => a.payment_date.localeCompare(b.payment_date) || a.id - b.id,
    )
}

// Validación local del diálogo (el backend repite todo). Devuelve un objeto de
// errores con "" en los campos válidos.
export function validateInstallment(form, today = localToday()) {
    const errors = { amount: '', payment_date: '', notes: '' }

    if (!(Number(form.amount) > 0)) errors.amount = 'Captura un monto mayor que 0.'
    if (!form.payment_date) errors.payment_date = 'Este campo es requerido'
    else if (form.payment_date > today) errors.payment_date = 'La fecha no puede ser futura.'
    if ((form.notes ?? '').length > INSTALLMENT_NOTES_MAX) {
        errors.notes = `Máximo ${INSTALLMENT_NOTES_MAX} caracteres.`
    }

    return errors
}

// Payload de POST /api/quotes/{id}/installments. Nota vacía → null.
export function installmentPayload(form) {
    const notes = (form.notes ?? '').trim()
    return {
        amount: Number(form.amount),
        payment_date: form.payment_date,
        notes: notes || null,
    }
}

// --- Listado de cotizaciones (QuotesView) ---

// El saldo solo tiene sentido mientras la cotización sigue abierta: pagada o
// cancelada ya no se cobra (se muestra un guion).
export function showsBalance(quote) {
    return quote?.status === 'Borrador'
}

// Filtro "Con abonos": abierta y con al menos un abono vigente.
export function hasInstallments(quote) {
    return showsBalance(quote) && Number(quote.installments_total) > 0
}

// Filtro "Vencidos" y etiqueta "Vencido": abierta, a crédito, con saldo y con
// el vencimiento ya pasado (el mismo día de vencimiento todavía no vence).
// "YYYY-MM-DD" contra la fecha LOCAL de hoy como texto: new Date(string)
// correría un día en México.
export function isOverdue(quote, today = localToday()) {
    return (
        showsBalance(quote) &&
        quote.payment_terms === 'credit' &&
        Number(quote.balance) > 0 &&
        !!quote.credit_due_date &&
        quote.credit_due_date < today
    )
}

// Clases del badge de status de cotización, compartidas entre el listado
// (QuotesView) y el detalle (QuoteDetailView) para que se vean idénticos.
export function statusClasses(status) {
	if (status === 'Convertida') return 'bg-success/10 text-success'
	if (status === 'Cancelada') return 'bg-danger/10 text-danger'
	return 'text-text-muted'
}

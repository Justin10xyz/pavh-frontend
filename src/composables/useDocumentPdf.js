import { ref, toValue, watch } from 'vue'

// Descarga y compartir del PDF de un documento (cotización, venta), común a
// QuoteDetailView y SaleDetailView.
//
// - fetchPdf(id): regresa una promesa con el blob del PDF.
// - filePrefix: prefijo del nombre del archivo (`${filePrefix}-${folio}.pdf`).
// - titlePrefix: prefijo del título al compartir (`${titlePrefix} ${folio}`).
// - id: ref o getter con el id del documento mostrado.
// - document: ref o getter con el documento ya cargado (o null mientras carga);
//   de él se toma el folio.
//
// Cada vista llama reset() desde su watch del id de la ruta.
export function useDocumentPdf({ fetchPdf, filePrefix, titlePrefix = filePrefix, id, document: doc }) {
	// Se detecta con un archivo de prueba: navigator.share puede existir (ej.
	// escritorio) sin soportar archivos, y en ese caso el botón ni se muestra.
	const canShareFiles = (() => {
		if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false
		try {
			const probe = new File([''], 'probe.pdf', { type: 'application/pdf' })
			return navigator.canShare({ files: [probe] })
		} catch {
			return false
		}
	})()

	// El PDF se cachea por documento: se usa tanto para descargar como para compartir.
	let pdfPromise = null
	const pdfBusy = ref(false)
	const pdfError = ref(null)

	function reset() {
		pdfPromise = null
		pdfError.value = null
	}

	function loadPdfFile() {
		const currentId = toValue(id)
		pdfPromise ??= fetchPdf(currentId).then(
			(blob) =>
				new File([blob], `${filePrefix}-${toValue(doc)?.folio ?? currentId}.pdf`, {
					type: 'application/pdf',
				}),
			(err) => {
				pdfPromise = null
				throw err
			}
		)
		return pdfPromise
	}

	// navigator.share() exige que se llame poco después del clic del usuario;
	// Safari lo rechaza si antes hubo que esperar a que el backend genere el
	// PDF. Por eso, donde se puede compartir, se pide el PDF en cuanto carga el
	// documento para que al hacer clic ya esté listo.
	watch(
		() => toValue(doc),
		(current) => {
			if (current && canShareFiles) loadPdfFile().catch(() => {})
		}
	)

	async function downloadPdf() {
		pdfBusy.value = true
		pdfError.value = null

		try {
			const file = await loadPdfFile()
			const url = URL.createObjectURL(file)
			const link = document.createElement('a')
			link.href = url
			link.download = file.name
			link.click()
			URL.revokeObjectURL(url)
		} catch (err) {
			pdfError.value = 'No se pudo generar el PDF.'
			console.error(err)
		} finally {
			pdfBusy.value = false
		}
	}

	async function sharePdf() {
		pdfBusy.value = true
		pdfError.value = null

		try {
			const file = await loadPdfFile()
			await navigator.share({ files: [file], title: `${titlePrefix} ${toValue(doc).folio}` })
		} catch (err) {
			// AbortError = el usuario cerró la hoja de compartir; no es un error.
			if (err?.name !== 'AbortError') {
				pdfError.value = 'No se pudo compartir el PDF. Intenta descargarlo.'
				console.error(err)
			}
		} finally {
			pdfBusy.value = false
		}
	}

	return { canShareFiles, pdfBusy, pdfError, downloadPdf, sharePdf, reset }
}

import { useToast } from 'primevue/usetoast'

// Avisos de acción exitosa (ej. "Cotización COT-0012 guardada"), renderizados
// por AppToast.vue. Centraliza severidad y duración para que todas las vistas
// se vean y se comporten igual.
//
// No usar para errores: los de validación van inline en el campo y los de
// guardado junto a las acciones del form, donde el usuario los puede leer con
// calma (un toast desaparece solo).
const LIFE_MS = 4000

export function useNotify() {
	const toast = useToast()

	return {
		success(summary, detail) {
			toast.add({ severity: 'success', summary, detail, life: LIFE_MS })
		},
		info(summary, detail) {
			toast.add({ severity: 'info', summary, detail, life: LIFE_MS })
		},
	}
}

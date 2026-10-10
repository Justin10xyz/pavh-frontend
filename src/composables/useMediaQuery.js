import { onMounted, onUnmounted, ref } from 'vue'

// Ref reactivo a una media query (ej. '(min-width: 64rem)' = breakpoint `lg` de
// Tailwind). Solo para lógica JS que el CSS no puede resolver (ej. desactivar un
// tooltip); el layout responsive en sí se resuelve con clases `sm:`/`md:`/`lg:`.
export function useMediaQuery(query) {
	const mediaQuery = window.matchMedia(query)
	const matches = ref(mediaQuery.matches)

	const onChange = (event) => {
		matches.value = event.matches
	}

	onMounted(() => mediaQuery.addEventListener('change', onChange))
	onUnmounted(() => mediaQuery.removeEventListener('change', onChange))

	return matches
}

import './css/main.css'

// Inter — UI general
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

// Source Serif 4 — solo wordmark y títulos de página
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'

// Tabler Icons — íconos del sidebar (self-hosted, sin CDN)
import '@tabler/icons-webfont/dist/tabler-icons.min.css'

//PrimeVue
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(PrimeVue, {
	unstyled: true,
	pt: {
		directives: {
			// Unstyled: el tooltip se monta en <body>, así que se estiliza aquí y no con :deep().
			// `absolute` es necesario porque PrimeVue solo calcula left/top.
			tooltip: {
				root: { class: 'absolute max-w-xs p-1 pointer-events-none' },
				text: { class: 'bg-primary text-white text-xs font-medium px-2 py-1 rounded-md' },
				arrow: { class: 'hidden' },
			},
		},
	}
})
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.use(createPinia())
app.use(router)

app.mount('#app')

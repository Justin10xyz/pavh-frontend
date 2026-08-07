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

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(PrimeVue, {
	unstyled: true,
	pt: {

	}
})

app.use(createPinia())
app.use(router)

app.mount('#app')

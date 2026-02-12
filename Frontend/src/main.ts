import './css/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VueKonva from 'vue-konva'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.config.errorHandler = (err, instance, info) => {
  console.error('VUE ERROR:', err, info)
}

app.use(pinia)
app.use(router)
app.use(VueKonva)

console.log('App Initialized. Store:', !!pinia)

app.mount('#app')

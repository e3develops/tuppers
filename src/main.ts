import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { vLongpress } from './lib/longpress'
import { setupUpdates } from './lib/update'
import { state } from './store'
import './style.css'

createApp(App).directive('longpress', vLongpress).use(router).mount('#app')

// Se actualiza sola, salvo en mitad del modo cocina o con un temporizador en marcha
setupUpdates(() => router.currentRoute.value.name === 'cocinar' || state.timers.length > 0)

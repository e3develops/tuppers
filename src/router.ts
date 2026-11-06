import { createRouter, createWebHashHistory } from 'vue-router'
import { state } from './store'
import HoyView from './views/HoyView.vue'
import CompraView from './views/CompraView.vue'
import CocinarView from './views/CocinarView.vue'
import RecetasView from './views/RecetasView.vue'
import RecetaView from './views/RecetaView.vue'
import AjustesView from './views/AjustesView.vue'
import BienvenidaView from './views/BienvenidaView.vue'

export const router = createRouter({
  // Hash: funciona en GitHub Pages sin 404 al recargar
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'hoy', component: HoyView },
    { path: '/compra', name: 'compra', component: CompraView },
    { path: '/cocinar', name: 'cocinar', component: CocinarView },
    { path: '/recetas', name: 'recetas', component: RecetasView },
    { path: '/recetas/:id', name: 'receta', component: RecetaView },
    { path: '/ajustes', name: 'ajustes', component: AjustesView },
    { path: '/bienvenida', name: 'bienvenida', component: BienvenidaView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

router.beforeEach(to => {
  if (!state.onboarded && to.name !== 'bienvenida') return { name: 'bienvenida' }
  if (state.onboarded && to.name === 'bienvenida') return { name: 'hoy' }
  return true
})

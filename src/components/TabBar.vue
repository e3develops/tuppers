<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { cards, prepShopping } from '../lib/day'

const route = useRoute()
const tabs = [
  { to: '/', name: 'hoy', label: 'Hoy' },
  { to: '/compra', name: 'compra', label: 'Compra' },
  { to: '/cocinar', name: 'cocinar', label: 'Cocinar' },
  { to: '/recetas', name: 'recetas', label: 'Recetas' },
]
const active = (name: string) => route.name === name || (name === 'recetas' && route.name === 'receta')
// Puntito amarillo cuando toca comprar o cocinar hoy
const dot = computed(() => ({
  compra: cards.value.some(c => c.kind === 'compra') && prepShopping.value.done < prepShopping.value.total,
  cocinar: cards.value.some(c => c.kind === 'cocinar-hoy' || c.kind === 'cocinar-pendiente'),
}))
</script>

<template>
  <nav class="tabbar" aria-label="Secciones">
    <router-link v-for="t in tabs" :key="t.name" :to="t.to" :class="{ on: active(t.name) }" :aria-current="active(t.name) ? 'page' : undefined">
      <span v-if="(t.name === 'compra' && dot.compra) || (t.name === 'cocinar' && dot.cocinar)" class="dot" aria-hidden="true"></span>
      <svg v-if="t.name === 'hoy'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><circle cx="12" cy="15" r="2.2" fill="currentColor" /></svg>
      <svg v-else-if="t.name === 'compra'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.5l2.2 11h10.6l2-8H6.4" /><circle cx="9" cy="19.5" r="1.6" /><circle cx="17" cy="19.5" r="1.6" /></svg>
      <svg v-else-if="t.name === 'cocinar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11h16v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M2 11h2M20 11h2M9 7c0-1.5 1-1.5 1-3M14 7c0-1.5 1-1.5 1-3" /></svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5z" /><path d="M5 19.5V4.5M9 7h6M9 11h6" /></svg>
      {{ t.label }}
    </router-link>
  </nav>
</template>

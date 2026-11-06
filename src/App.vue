<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import TimerBar from './components/TimerBar.vue'
import { state } from './store'
import { toast, hideToast } from './lib/toast'
import { ui } from './ui'
import { isTimeTravel, now } from './lib/now'

const route = useRoute()
const showTabs = computed(() => route.name !== 'bienvenida' && !ui.hideTabs)

// Altura de la barra de temporizadores, para que no tape el contenido
watchEffect(() => {
  const n = state.timers.length
  document.documentElement.style.setProperty('--timers', n ? n * 58 + 6 + 'px' : '0px')
})

function act() {
  const fn = toast.onAction
  hideToast()
  if (fn) fn()
}
</script>

<template>
  <TimerBar />
  <div v-if="isTimeTravel" class="travel">🕒 Modo prueba: {{ now.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</div>
  <router-view />
  <TabBar v-if="showTabs" />
  <div v-if="toast.text" :key="toast.id" class="toast" :class="{ 'no-tabs': !showTabs }" role="status">
    <span>{{ toast.text }}</span>
    <button v-if="toast.action" @click="act">{{ toast.action }}</button>
  </div>
</template>

<style>
.toast.no-tabs {
  bottom: calc(12px + var(--sab));
}
.travel {
  position: fixed;
  z-index: 45;
  right: calc(8px + var(--sar));
  bottom: calc(var(--tabbar) + 8px + var(--sab));
  background: var(--yellow-bg);
  color: var(--yellow);
  border: 1px solid rgba(255, 213, 74, 0.4);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 99px;
  pointer-events: none;
}
</style>

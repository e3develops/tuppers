<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { activeTimers, remaining, removeTimer } from '../lib/timers'
import type { Timer } from '../store'

const bar = ref<HTMLElement | null>(null)

// El contenido se aparta lo que mide de verdad la barra (no un cálculo aproximado)
function measure() {
  const h = bar.value ? bar.value.offsetHeight : 0
  document.documentElement.style.setProperty('--timers', h ? h + 'px' : '0px')
}
watch(
  () => activeTimers.value.map(t => t.id + (t.done ? 'd' : '')).join(','),
  () => nextTick(measure),
  { immediate: true },
)
onMounted(() => {
  window.addEventListener('resize', measure)
  window.addEventListener('orientationchange', measure)
})
onUnmounted(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('orientationchange', measure)
})

function quitar(t: Timer) {
  if (!t.done && !confirm(`¿Quitar el temporizador de ${t.label}? Le quedan ${remaining(t)}.`)) return
  removeTimer(t.id)
}
</script>

<template>
  <div v-if="activeTimers.length" ref="bar" class="timers" :class="{ multi: activeTimers.length > 1 }">
    <div v-for="t in activeTimers" :key="t.id" class="timer" :class="{ done: t.done }" :role="t.done ? 'alert' : undefined">
      <span class="t-label">{{ t.done ? '⏰ ' + t.label + ': ¡ya está!' : t.label }}</span>
      <span v-if="!t.done" class="t-time">{{ remaining(t) }}</span>
      <button class="t-x" :aria-label="t.done ? 'Vale, parar la alarma' : 'Quitar temporizador de ' + t.label" @click="quitar(t)">{{ t.done ? 'Vale' : '✕' }}</button>
    </div>
  </div>
</template>

<style scoped>
.timers.multi {
  display: flex;
  flex-wrap: wrap;
  padding-left: calc(6px + var(--sal));
  padding-right: calc(6px + var(--sar));
}
.timers.multi .timer {
  width: calc(50% - 8px);
  margin: 3px 4px;
  min-height: 46px;
  padding: 4px 4px 4px 10px;
}
.timers.multi .timer + .timer {
  margin-top: 3px;
}
.timers.multi .timer.done {
  width: calc(100% - 8px);
}
.timers.multi .t-label {
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.timers.multi .t-time {
  font-size: 18px;
  margin-right: 2px;
}
.timers.multi .t-x {
  width: 38px;
  height: 38px;
  font-size: 16px;
}
</style>

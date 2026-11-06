<script setup lang="ts">
import { activeTimers, remaining, removeTimer } from '../lib/timers'
</script>

<template>
  <div v-if="activeTimers.length" class="timers" role="timer" aria-live="polite">
    <div v-for="t in activeTimers" :key="t.id" class="timer" :class="{ done: t.done }">
      <span class="t-label">{{ t.done ? '¡' + t.label + ' listo!' : t.label }}</span>
      <span v-if="!t.done" class="t-time">{{ remaining(t) }}</span>
      <button class="t-x" :aria-label="t.done ? 'Vale' : 'Quitar temporizador ' + t.label" @click="removeTimer(t.id)">{{ t.done ? 'Vale' : '✕' }}</button>
    </div>
  </div>
</template>

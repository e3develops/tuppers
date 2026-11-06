<script setup lang="ts">
import { computed } from 'vue'
import type { TupperOfDay } from '../lib/plan'
import { eatOutAdvice } from '../lib/plan'
import { state } from '../store'
import { showToast } from '../lib/toast'
import ReheatBlock from './ReheatBlock.vue'

const props = defineProps<{ t: TupperOfDay }>()
const eatOut = computed(() => state.eatOut[props.t.date])

const where = computed(() => {
  if (props.t.storage === 'nevera') return '🥶 Está en la nevera: recién hecho.'
  return '❄️ Lo pasaste anoche del congelador a la nevera.'
})

function comoFuera() {
  const advice = eatOutAdvice(props.t.storage)
  state.eatOut[props.t.date] = advice
  if (advice === 'congelar') state.reserve++
  showToast(advice === 'congelar' ? 'Al congelador: +1 a la reserva 🧊' : 'Apuntado: cómelo como cena en 24 h', 'Deshacer', undo)
}
function undo() {
  if (state.eatOut[props.t.date] === 'congelar') state.reserve = Math.max(0, state.reserve - 1)
  delete state.eatOut[props.t.date]
}
</script>

<template>
  <section v-if="eatOut" class="card tupper out">
    <div class="tp-top">
      <span class="chip">Hoy comes fuera</span>
    </div>
    <h2 class="tp-name">{{ t.recipe.name }}</h2>
    <div v-if="eatOut === 'congelar'" class="banner ice">🧊 Mételo al congelador: queda de reserva.</div>
    <div v-else class="banner yellow">🍽️ Cómelo mañana o pasado como cena, máximo 24 h.</div>
    <button class="btn ghost" @click="undo">Deshacer</button>
  </section>

  <section v-else class="card tupper" :class="t.recipe.type">
    <div class="tp-top">
      <span class="chip" :class="t.recipe.type">{{ t.recipe.type === 'horno' ? 'Horno' : 'Salsa' }} · Plato {{ t.plato }}</span>
      <span class="chip">Semana {{ t.semana }}</span>
    </div>
    <p class="tp-kicker">Hoy toca</p>
    <h2 class="tp-name">{{ t.recipe.name }}</h2>
    <p class="tp-where">{{ where }}</p>
    <ReheatBlock :recipe="t.recipe" />
    <button class="btn" @click="comoFuera">🍽️ Hoy como fuera</button>
  </section>
</template>

<style scoped>
.tupper > * + * {
  margin-top: 12px;
}
.tupper.horno {
  background: linear-gradient(180deg, rgba(255, 159, 69, 0.2), rgba(255, 159, 69, 0.06) 55%, var(--surface));
  border-color: rgba(255, 159, 69, 0.45);
}
.tupper.salsa {
  background: linear-gradient(180deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.06) 55%, var(--surface));
  border-color: rgba(255, 107, 107, 0.45);
}
.tp-top {
  display: flex;
  flex-wrap: wrap;
}
.tp-kicker {
  font-size: 15px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}
.tupper .tp-kicker + .tp-name {
  margin-top: 2px;
}
.tp-name {
  font-size: 28px;
  line-height: 1.15;
}
.horno .tp-name {
  color: #ffd2a8;
}
.salsa .tp-name {
  color: #ffc4c4;
}
.tp-where {
  font-weight: 700;
  color: var(--ink-2);
}
</style>

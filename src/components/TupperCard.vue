<script setup lang="ts">
import { computed } from 'vue'
import type { TupperOfDay } from '../lib/plan'
import { eatOutAdvice } from '../lib/plan'
import { addDays, fromISO, toISO } from '../lib/dates'
import { state } from '../store'
import { showToast } from '../lib/toast'
import ReheatBlock from './ReheatBlock.vue'

const props = defineProps<{ t: TupperOfDay }>()
const eatOut = computed(() => state.eatOut[props.t.date])
/** ¿Marcaste anoche que lo pasabas del congelador a la nevera? */
const thawed = computed(() => !!state.nightDone[toISO(addDays(fromISO(props.t.date), -1))])

const where = computed(() => {
  if (props.t.storage === 'nevera') return '🥶 Está en la nevera (lo cocinaste el domingo).'
  if (thawed.value) return '❄️ Lo pasaste anoche del congelador a la nevera.'
  return '❄️ Venía del congelador. Si no lo sacaste anoche, se puede desde congelado: tarda el doble.'
})

function comoFuera() {
  const advice = eatOutAdvice(props.t.storage, thawed.value)
  state.eatOut[props.t.date] = advice
  if (advice !== 'cena') state.reserve++
  const msg = advice === 'cena' ? 'Apuntado: te lo recuerdo para la cena de mañana' : 'Queda de reserva: +1 🧊'
  showToast(msg, 'Deshacer', undo)
}
function undo() {
  const a = state.eatOut[props.t.date]
  if (a && a !== 'cena') state.reserve = Math.max(0, state.reserve - 1)
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
    <div v-else-if="eatOut === 'reserva'" class="banner ice">🧊 Déjalo en el congelador: queda de reserva.</div>
    <div v-else class="banner yellow">🍽️ Ya está descongelado: cómelo esta noche o mañana como cena, como mucho en 24 h.</div>
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
    <ReheatBlock :recipe="t.recipe" :frozen="t.storage === 'congelador'" />
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

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DATA, getRecipe } from '../data'
import { state } from '../store'
import { now } from '../lib/now'
import { formatLong, formatShort } from '../lib/dates'
import { cards, cycleWeek, night, prepShopping, puente, startDate, today, todayISO, tupperToday } from '../lib/day'
import { showToast } from '../lib/toast'
import TupperCard from '../components/TupperCard.vue'

const router = useRouter()
const comodin = getRecipe(DATA.comodin)
const reserveUsedToday = computed(() => !!state.reserveUsed[todayISO.value])

const noTupperReason = computed(() => {
  if (puente.value) return `Aún no ha empezado el ciclo: la semana 1 empieza el lunes ${formatShort(startDate.value)}.`
  if (today.value.getDay() === 0) return 'Domingo: hoy no hay tupper.'
  return 'Hoy no hay tupper.'
})

function nightDone() {
  const k = todayISO.value
  state.nightDone[k] = true
  showToast('¡Hecho! Mañana lo tienes listo 👌', 'Deshacer', () => delete state.nightDone[k])
}

function useReserve() {
  if (state.reserve <= 0) return
  const k = todayISO.value
  state.reserve--
  state.reserveUsed[k] = true
  showToast('Sacado de la reserva 🧊', 'Deshacer', () => {
    state.reserve++
    delete state.reserveUsed[k]
  })
}
function undoReserve() {
  state.reserve++
  delete state.reserveUsed[todayISO.value]
}
const hello = computed(() => {
  const h = now.value.getHours()
  return h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
})
</script>

<template>
  <main class="page stack">
    <header class="topbar">
      <div>
        <p class="sub">{{ hello }} 👋</p>
        <h1>{{ formatLong(today) }}</h1>
        <p class="sub">{{ cycleWeek ? 'Semana ' + cycleWeek + ' del ciclo' : 'Modo puente' }}</p>
      </div>
      <router-link to="/ajustes" class="gear" aria-label="Ajustes">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
      </router-link>
    </header>

    <!-- Aviso nocturno -->
    <div v-if="night" class="banner yellow" role="alert">
      🌙 Antes de dormir: pasa a la nevera el tupper de mañana (Plato {{ night.plato }} · {{ night.recipe.name }}).
      <button class="btn" @click="nightDone">✓ Hecho</button>
    </div>

    <!-- Avisos de compra y cocina -->
    <template v-for="c in cards" :key="c.kind">
      <router-link v-if="c.kind === 'compra'" to="/compra" class="card prep">
        <span class="prep-ic">🛒</span>
        <span class="grow">
          <b>Toca compra · Semana {{ c.semana }}</b>
          <span class="muted small">{{ prepShopping.total - prepShopping.done === 0 ? 'Compra hecha ✓' : prepShopping.total - prepShopping.done + ' productos' }}</span>
        </span>
        <span class="arrow">›</span>
      </router-link>
      <div v-else-if="c.kind === 'cocinar-manana'" class="card prep">
        <span class="prep-ic">⏰</span>
        <span class="grow">
          <b>Mañana cocinas</b>
          <span class="muted small">{{ c.plato1.name }} + {{ c.plato2.name }} · ~{{ c.minutes }} min</span>
        </span>
      </div>
      <div v-else class="card prep hot">
        <span class="prep-ic">👨‍🍳</span>
        <span class="grow">
          <b>Hoy cocinas · Semana {{ c.semana }}</b>
          <span class="muted small">Plato 1 + Plato 2, paso a paso con temporizadores.</span>
          <button class="btn primary" @click="router.push('/cocinar')">Ir al modo cocina</button>
        </span>
      </div>
    </template>

    <!-- El tupper de hoy -->
    <TupperCard v-if="tupperToday" :t="tupperToday" />

    <section v-else-if="reserveUsedToday" class="card stack-sm">
      <span class="chip ice">De la reserva</span>
      <h2>Hoy: tupper de la reserva 🧊</h2>
      <p class="muted">Viene congelado: desde congelado tarda el doble. Plato de horno → air fryer 180 °C. Plato con salsa → sartén con un chorrito de agua, a fuego medio, removiendo.</p>
      <button class="btn ghost" @click="undoReserve">Deshacer</button>
    </section>

    <section v-else class="card stack-sm">
      <span class="chip comodin">Sin tupper</span>
      <h2>{{ noTupperReason }}</h2>
      <p class="muted">Tira de las comidas de siempre o del comodín:</p>
      <router-link :to="'/recetas/' + comodin.id" class="comodin-link">
        <span>🍝</span>
        <span class="grow"><b>{{ comodin.name }}</b><span class="muted small">Comodín · {{ comodin.minutes }} min</span></span>
        <span class="arrow">›</span>
      </router-link>
    </section>

    <!-- Reserva -->
    <div v-if="state.reserve > 0" class="card reserve">
      <span class="grow"><b>🧊 Reserva: {{ state.reserve }}</b><span class="muted small">Para un día sin tupper</span></span>
      <button class="btn small" @click="useReserve">Usar uno</button>
    </div>

    <!-- Comidas fijas -->
    <section class="stack-sm">
      <h3 class="muted">Comidas de siempre</h3>
      <div v-for="m in DATA.comidasFijas" :key="m.id" class="card tight meal">
        <span class="meal-ic">{{ m.emoji }}</span>
        <span class="grow">
          <b>{{ m.title }}</b>
          <span class="small">{{ m.text }}</span>
          <span v-if="m.alt" class="small muted">O bien: {{ m.alt }}</span>
        </span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.gear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink-2);
  -webkit-align-self: flex-start;
  align-self: flex-start;
}
.prep {
  display: flex;
  align-items: flex-start;
  text-decoration: none;
}
.prep.hot {
  border-color: rgba(91, 140, 255, 0.6);
  background: rgba(91, 140, 255, 0.1);
}
.prep-ic {
  font-size: 28px;
  line-height: 1;
  margin-right: 12px;
  margin-top: 2px;
}
.prep b,
.prep .small {
  display: block;
}
.prep .btn {
  margin-top: 10px;
}
.arrow {
  font-size: 30px;
  color: var(--ink-3);
  line-height: 1;
  margin-left: 8px;
  -webkit-align-self: center;
  align-self: center;
}
.comodin-link {
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border-radius: 14px;
  padding: 12px 14px;
  text-decoration: none;
  min-height: 56px;
}
.comodin-link > span:first-child {
  font-size: 26px;
  margin-right: 12px;
}
.comodin-link b,
.comodin-link .small {
  display: block;
}
.reserve {
  display: flex;
  align-items: center;
  background: var(--ice-bg);
  border-color: rgba(124, 200, 255, 0.35);
}
.reserve b,
.reserve .small {
  display: block;
}
.reserve b {
  color: var(--ice);
  font-size: 19px;
}
.reserve .btn {
  margin-left: 12px;
  flex: 0 0 auto;
}
.meal {
  display: flex;
  align-items: flex-start;
}
.meal-ic {
  font-size: 26px;
  margin-right: 12px;
  line-height: 1.2;
}
.meal b,
.meal .small {
  display: block;
}
.meal .small + .small {
  margin-top: 4px;
}
</style>

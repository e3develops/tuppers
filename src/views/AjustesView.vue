<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DATA } from '../data'
import { resetState, state } from '../store'
import { daysBetween, formatLong, fromISO, mondayOf, toISO } from '../lib/dates'
import { today } from '../lib/day'
import { showToast } from '../lib/toast'
import type { CookDay, Servings } from '../lib/plan'

const router = useRouter()
const startLabel = computed(() => formatLong(fromISO(state.settings.startDate)).toLowerCase())
const started = computed(() => daysBetween(fromISO(state.settings.startDate), today.value) >= 0)

function setStart(e: Event) {
  const input = e.target as HTMLInputElement
  const v = input.value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    input.value = state.settings.startDate // vacío o raro: se deja como estaba
    return
  }
  const monday = toISO(mondayOf(fromISO(v)))
  state.settings.startDate = monday
  input.value = monday // que el campo muestre el lunes, aunque elijas otro día de esa semana
  if (monday !== v) showToast('Ajustado al lunes de esa semana')
}
function setCookDay(d: CookDay) {
  state.settings.cookDay = d
}
function setServings(s: Servings) {
  state.settings.servings = s
}
function togglePantry(id: string) {
  if (state.pantryHave[id]) delete state.pantryHave[id]
  else state.pantryHave[id] = true
}
function reset() {
  if (!confirm('¿Borrar todo y empezar de cero? Se pierden la compra, la reserva y los ajustes.')) return
  resetState()
  router.replace('/bienvenida')
}
// Versión en hora local (la de compilación viene en UTC)
const version = (() => {
  const d = new Date(__APP_VERSION__)
  return isNaN(d.getTime()) ? __APP_VERSION__ : d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
})()
</script>

<template>
  <main class="page stack">
    <div class="topbar">
      <router-link to="/" class="btn ghost small back">‹ Hoy</router-link>
    </div>
    <h1>Ajustes</h1>

    <section class="card stack-sm">
      <label class="field">
        <span>Fecha de inicio (un lunes)</span>
        <input class="input" type="date" :value="state.settings.startDate" @change="setStart" />
      </label>
      <p class="small muted">La semana 1 del ciclo {{ started ? 'empezó' : 'empieza' }} el {{ startLabel }}.</p>
    </section>

    <section class="card stack-sm">
      <h3>Día de cocinar</h3>
      <div class="seg">
        <button :class="{ on: state.settings.cookDay === 'viernes' }" @click="setCookDay('viernes')">Viernes</button>
        <button :class="{ on: state.settings.cookDay === 'domingo' }" @click="setCookDay('domingo')">Domingo</button>
      </div>
      <p class="small muted">
        <template v-if="state.settings.cookDay === 'viernes'">El mismo día de la compra. Los 7 tuppers van al congelador y cada noche (de domingo a viernes) pasas a la nevera el del día siguiente.</template>
        <template v-else>Lunes a miércoles en la nevera; jueves, viernes, sábado y el extra al congelador. Te aviso la noche antes de cada uno.</template>
      </p>
    </section>

    <section class="card stack-sm">
      <h3>Raciones</h3>
      <div class="seg">
        <button :class="{ on: state.settings.servings === 1 }" @click="setServings(1)">Solo yo</button>
        <button :class="{ on: state.settings.servings === 2 }" @click="setServings(2)">Con mi padre</button>
      </div>
      <p class="small muted">"Con mi padre" duplica las cantidades de la compra y de las recetas, y los tuppers.</p>
    </section>

    <section class="card stack-sm">
      <div class="spread">
        <h3>🧊 Reserva</h3>
        <div class="row">
          <button class="btn small" aria-label="Quitar uno" @click="state.reserve = Math.max(0, state.reserve - 1)">−</button>
          <b class="res">{{ state.reserve }}</b>
          <button class="btn small" aria-label="Añadir uno" @click="state.reserve++">+</button>
        </div>
      </div>
      <p class="small muted">Tuppers en el congelador para un día sin tupper.</p>
    </section>

    <section class="card stack-sm">
      <h3>Despensa</h3>
      <p class="small muted">"En casa" no sale en la lista de la compra. Toca para cambiarlo cuando se acabe o lo compres.</p>
      <ul class="pantry">
        <li v-for="p in DATA.despensa" :key="p.id">
          <span class="grow">{{ p.name }}</span>
          <button class="pill" :class="{ have: state.pantryHave[p.id] }" :aria-pressed="!!state.pantryHave[p.id]" @click="togglePantry(p.id)">{{ state.pantryHave[p.id] ? '🏠 En casa' : '🛒 En la lista' }}</button>
        </li>
      </ul>
    </section>

    <button class="btn danger" @click="reset">Restablecer datos</button>
    <p class="tiny muted center">Tuppers · versión {{ version }}</p>
  </main>
</template>

<style scoped>
.back {
  margin-left: -10px;
  width: auto;
}
.res {
  font-size: 24px;
  min-width: 36px;
  text-align: center;
}
.pantry {
  list-style: none;
  margin: 0;
  padding: 0;
}
.pantry li {
  display: flex;
  align-items: center;
  min-height: 56px;
  border-top: 1px solid var(--line);
}
.pill {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 15px;
  background: var(--surface-2);
  color: var(--ink-2);
  white-space: nowrap;
  margin-left: 8px;
}
.pill.have {
  background: var(--green-bg);
  color: var(--green);
}
</style>

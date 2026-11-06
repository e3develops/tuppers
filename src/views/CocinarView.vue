<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DATA, findRecipe } from '../data'
import type { CookPlanStep, Recipe } from '../data/types'
import { state } from '../store'
import { ui } from '../ui'
import { plural, prepPlan, prepWeekISO } from '../lib/day'
import { tupperLabels } from '../lib/plan'
import { remaining, startTimer, timerFor } from '../lib/timers'
import { unlockAudio } from '../lib/audio'
import { awake, keepAwake, releaseAwake } from '../lib/wakelock'
import { showToast } from '../lib/toast'

const route = useRoute()
const router = useRouter()

/** Modo "solo esta receta" (desde Recetas) o la semana que toca */
const single = computed<Recipe | undefined>(() => {
  const id = route.query.receta
  return typeof id === 'string' ? findRecipe(id) : undefined
})
const week = computed(() => (single.value ? null : prepPlan.value))

const ENFRIAR: CookPlanStep = { text: 'Enfría unos 20 min (máximo 2 h fuera de la nevera), reparte y etiqueta.', timerMin: 20, timerLabel: 'Enfriar' }
const steps = computed<CookPlanStep[]>(() => {
  if (single.value) {
    const r = single.value
    const s: CookPlanStep[] = r.steps.map(x => ({ ...x, recipe: r.id }))
    if (r.type !== 'comodin') s.push(ENFRIAR)
    return s
  }
  if (!week.value) return []
  return DATA.planes[String(week.value.semana) as '1' | '2' | '3'].steps
})
const key = computed(() => (single.value ? 'receta:' + single.value.id : week.value ? 'semana:' + prepWeekISO.value : ''))
const totalMin = computed(() => (single.value ? single.value.minutes : week.value ? DATA.planes[String(week.value.semana) as '1' | '2' | '3'].totalMin : 0))
const dishes = computed<Recipe[]>(() => (single.value ? [single.value] : week.value ? [week.value.plato1, week.value.plato2] : []))

type Mode = 'inicio' | 'pasos' | 'reparte'
const mode = ref<Mode>('inicio')
const idx = ref(0)
// Paso guardado de este modo cocina (si ya no existe, p. ej. tras editar data.json, se ignora)
const saved = computed(() => {
  const n = state.cookSteps[key.value]
  return typeof n === 'number' && n >= 0 && n < steps.value.length ? n : -1
})
const alreadyCooked = computed(() => !single.value && !!week.value && !!state.cooked[prepWeekISO.value])

watch(key, () => {
  mode.value = 'inicio'
  ui.hideTabs = false
})

function begin(from = 0) {
  if (!steps.value.length) return
  from = Math.max(0, Math.min(from, steps.value.length - 1))
  unlockAudio()
  keepAwake()
  idx.value = from
  state.cookSteps[key.value] = from
  mode.value = 'pasos'
  ui.hideTabs = true
  window.scrollTo(0, 0)
}
function go(d: number) {
  const n = idx.value + d
  if (n < 0) return
  if (n >= steps.value.length) {
    if (single.value) return finish()
    mode.value = 'reparte'
    window.scrollTo(0, 0)
    return
  }
  idx.value = n
  state.cookSteps[key.value] = n
  window.scrollTo(0, 0)
}
function exit() {
  releaseAwake()
  ui.hideTabs = false
  mode.value = 'inicio'
}
function finish() {
  const wk = prepWeekISO.value
  let msg = '¡Listo! A disfrutarlo 😋'
  if (!single.value && !state.cooked[wk]) {
    // Se guarda con qué día de cocinar se hizo (nevera/congelador de esa semana)
    state.cooked[wk] = state.settings.cookDay
    state.reserve += state.settings.servings
    msg = `¡Semana lista! +${state.settings.servings} a la reserva 🧊`
  }
  delete state.cookSteps[key.value]
  exit()
  showToast(msg)
  router.push('/')
}
onUnmounted(() => {
  releaseAwake()
  ui.hideTabs = false
})

const step = computed(() => steps.value[idx.value])
// Si el paso no existe (datos cambiados), de vuelta al inicio en vez de una pantalla en blanco
watch(step, s => {
  if (!s && mode.value === 'pasos') exit()
})
const stepRecipe = computed(() => (step.value && step.value.recipe ? findRecipe(step.value.recipe) : undefined))
const timer = computed(() => (step.value && step.value.timerMin ? timerFor(step.value.timerLabel || 'Temporizador', step.value.timerMin) : undefined))
function startStepTimer() {
  const s = step.value
  if (!s || !s.timerMin) return
  unlockAudio()
  startTimer(s.timerLabel || 'Temporizador', s.timerMin)
}

const labels = computed(() => tupperLabels(state.settings.cookDay))
const plateName = (p: 1 | 2) => (week.value ? (p === 1 ? week.value.plato1.name : week.value.plato2.name) : '')
const plateType = (p: 1 | 2) => (week.value ? (p === 1 ? week.value.plato1.type : week.value.plato2.type) : 'horno')
</script>

<template>
  <!-- Inicio -->
  <main v-if="mode === 'inicio'" class="page stack">
    <header>
      <h1>{{ single ? 'Cocinar receta' : 'Modo cocina' }}</h1>
      <p class="muted">
        <template v-if="week">Semana {{ week.semana }} · {{ state.settings.cookDay === 'domingo' ? 'el domingo' : 'el viernes' }}</template>
        <template v-else-if="single">Solo esta receta</template>
      </p>
    </header>

    <template v-if="steps.length">
      <div v-for="(d, i) in dishes" :key="d.id" class="card dish" :class="d.type">
        <span class="chip" :class="d.type">{{ single ? (d.type === 'horno' ? 'Horno' : d.type === 'salsa' ? 'Salsa' : 'Comodín') : 'Plato ' + (i + 1) + ' · ' + (d.type === 'horno' ? 'Horno' : 'Salsa') }}</span>
        <h2>{{ d.name }}</h2>
        <p class="muted small">{{ d.type === 'comodin' ? plural(state.settings.servings, 'ración', 'raciones') : d.tuppers * state.settings.servings + ' tuppers' }} · ~{{ d.minutes }} min</p>
      </div>
      <div class="card tight spread">
        <span>
          <b>⏱ Tiempo total: ~{{ totalMin }} min<template v-if="single && single.type !== 'comodin'"> + 20 min de enfriar</template></b>
          <span class="small muted block">{{ plural(steps.length, 'paso', 'pasos') }} · intentaré que la pantalla no se apague</span>
        </span>
      </div>
      <div v-if="alreadyCooked" class="banner green">✓ Esta semana ya está cocinada. Puedes repasar los pasos si quieres.</div>
      <div class="btns">
        <button v-if="saved > 0" class="btn primary big" @click="begin(saved)">▶ Seguir por el paso {{ saved + 1 }}</button>
        <button class="btn big" :class="{ primary: saved <= 0 }" @click="begin(0)">{{ saved > 0 ? 'Empezar de nuevo' : '▶ Empezar' }}</button>
        <router-link v-if="single" class="btn ghost" :to="'/recetas/' + single.id">Ver la receta</router-link>
      </div>
    </template>
    <div v-else class="card stack-sm">
      <h2>Aún no hay nada que cocinar</h2>
      <p class="muted">El ciclo todavía no ha empezado. Puedes cocinar cualquier receta desde Recetas.</p>
      <router-link to="/recetas" class="btn">Ver recetas</router-link>
    </div>
  </main>

  <!-- Paso a paso -->
  <main v-else-if="mode === 'pasos' && step" class="page no-tabs cook">
    <div class="cook-top">
      <button class="btn ghost small" @click="exit">✕ Salir</button>
      <b>Paso {{ idx + 1 }} de {{ steps.length }}</b>
    </div>
    <p v-if="awake" class="tiny muted awake">🔆 Pantalla encendida</p>
    <div class="dots"><i v-for="(_, i) in steps" :key="i" :class="{ on: i <= idx }"></i></div>

    <span v-if="stepRecipe" class="chip" :class="stepRecipe.type">{{ stepRecipe.name }}</span>
    <span v-else class="chip">Final</span>
    <p class="step-text">{{ step.text }}</p>

    <div v-if="step.timerMin" class="timer-box">
      <button v-if="!timer" class="btn yellow big" @click="startStepTimer">▶ Iniciar {{ step.timerMin }} min · {{ step.timerLabel }}</button>
      <div v-else-if="!timer.done" class="t-running">⏱ {{ step.timerLabel }}: quedan <b>{{ remaining(timer) }}</b></div>
      <div v-else class="t-running ok">✓ {{ step.timerLabel }}: ¡listo!</div>
    </div>

    <div v-if="step.meanwhile" class="meanwhile">
      <b>Mientras tanto</b>
      <p>{{ step.meanwhile }}</p>
    </div>

    <div class="cook-nav">
      <button class="btn big" :disabled="idx === 0" @click="go(-1)">‹ Atrás</button>
      <button class="btn primary big" @click="go(1)">{{ idx === steps.length - 1 ? (single ? 'Terminar ✓' : 'Repartir ›') : 'Siguiente ›' }}</button>
    </div>
  </main>

  <!-- Reparte así -->
  <main v-else-if="mode === 'reparte'" class="page no-tabs stack">
    <div class="cook-top">
      <button class="btn ghost small" @click="mode = 'pasos'">‹ Atrás</button>
      <b>Reparte así</b>
    </div>
    <h1>Reparte así 🍱</h1>
    <p class="muted">Copia la etiqueta en cada tapa{{ state.settings.servings === 2 ? ' (2 tuppers de cada, uno para tu padre)' : '' }}.</p>
    <div class="tuppers">
      <div v-for="l in labels" :key="l.day" class="tup" :class="[plateType(l.plato), { extra: l.extra }]">
        <b class="t-day">{{ l.day }}</b>
        <span class="t-plate">Plato {{ l.plato }}</span>
        <span class="t-name">{{ plateName(l.plato) }}</span>
        <span class="t-where" :class="l.storage">{{ l.storage === 'nevera' ? '🥶 Nevera' : '❄️ Congelador' }}{{ l.extra ? ' · reserva' : '' }}</span>
        <span v-if="state.settings.servings === 2" class="t-x2">×2</span>
      </div>
    </div>
    <p v-if="state.settings.cookDay === 'viernes'" class="banner yellow small">Todo al congelador. Cada noche, de domingo a viernes, pasa a la nevera el tupper del día siguiente (te lo recuerdo).</p>
    <p v-else class="banner yellow small">Lunes, martes y miércoles a la nevera. El resto al congelador: te avisaré la noche antes de cada uno.</p>
    <button class="btn green big" @click="finish">✓ Hecho</button>
  </main>
</template>

<style scoped>
.block {
  display: block;
}
.big {
  min-height: 62px;
  font-size: 20px;
}
.dish > * + * {
  margin-top: 6px;
}
.dish.horno {
  border-color: rgba(255, 159, 69, 0.45);
  background: var(--orange-bg);
}
.dish.salsa {
  border-color: rgba(255, 107, 107, 0.45);
  background: var(--red-bg);
}
.cook {
  min-height: 100vh;
  padding-bottom: calc(110px + var(--sab));
}
.cook-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.cook-top .btn {
  margin-left: -10px;
}
.awake {
  margin: -4px 0 8px;
}
.dots {
  display: flex;
  margin-bottom: 18px;
}
.dots i {
  flex: 1 1 0;
  height: 6px;
  border-radius: 99px;
  background: var(--surface-2);
}
.dots i + i {
  margin-left: 4px;
}
.dots i.on {
  background: var(--accent);
}
.step-text {
  font-size: 28px;
  line-height: 1.35;
  font-weight: 700;
  margin-top: 14px;
}
.timer-box {
  margin-top: 22px;
}
.t-running {
  background: var(--yellow-bg);
  color: var(--yellow);
  border-radius: 16px;
  padding: 16px;
  font-size: 22px;
  font-weight: 800;
  text-align: center;
}
.t-running b {
  font-size: 28px;
  font-variant-numeric: tabular-nums;
}
.t-running.ok {
  background: var(--green-bg);
  color: var(--green);
}
.meanwhile {
  margin-top: 18px;
  border-left: 4px solid var(--accent);
  background: rgba(91, 140, 255, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
}
.meanwhile b {
  display: block;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
}
.meanwhile p {
  font-size: 20px;
  font-weight: 700;
}
.cook-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  padding: 12px calc(16px + var(--sar)) calc(12px + var(--sab)) calc(16px + var(--sal));
  background: rgba(13, 16, 21, 0.96);
  border-top: 1px solid var(--line);
}
.cook-nav .btn {
  flex: 1 1 0;
}
.cook-nav .btn + .btn {
  margin-left: 10px;
  flex-grow: 1.6;
}
.tuppers {
  display: -ms-grid;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
}
.tup {
  position: relative;
  border-radius: 16px;
  padding: 12px;
  border: 2px dashed var(--line);
  background: var(--surface);
}
.tup.horno {
  border-color: rgba(255, 159, 69, 0.6);
}
.tup.salsa {
  border-color: rgba(255, 107, 107, 0.6);
}
.tup.extra {
  grid-column: 1 / -1;
}
.tup > span,
.tup > b {
  display: block;
}
.t-day {
  font-size: 22px;
  font-weight: 900;
}
.t-plate {
  font-weight: 800;
  font-size: 15px;
}
.horno .t-plate {
  color: var(--orange);
}
.salsa .t-plate {
  color: var(--red);
}
.t-name {
  font-size: 14px;
  color: var(--ink-2);
  margin: 2px 0 6px;
}
.t-where {
  font-size: 15px;
  font-weight: 800;
}
.t-where.nevera {
  color: var(--green);
}
.t-where.congelador {
  color: var(--ice);
}
.t-x2 {
  position: absolute;
  top: 10px;
  right: 12px;
  font-weight: 900;
  color: var(--ink-2);
}
</style>

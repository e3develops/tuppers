<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { state } from '../store'
import { formatLong, fromISO, mondayOf, nextMonday, toISO } from '../lib/dates'
import { now } from '../lib/now'
import type { CookDay, Servings } from '../lib/plan'

const router = useRouter()
const start = ref(toISO(nextMonday(now.value)))
const cookDay = ref<CookDay>('viernes')
const servings = ref<Servings>(1)

function setStart(e: Event) {
  const input = e.target as HTMLInputElement
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.value)) start.value = toISO(mondayOf(fromISO(input.value)))
  input.value = start.value // siempre el lunes de esa semana
}
function go() {
  state.settings.startDate = start.value
  state.settings.cookDay = cookDay.value
  state.settings.servings = servings.value
  state.onboarded = true
  router.replace('/')
}
</script>

<template>
  <main class="page no-tabs stack welcome">
    <div class="hero">
      <div class="logo" aria-hidden="true">🍱</div>
      <h1>Tuppers</h1>
      <p class="muted">Tu semana de comidas, la compra y el modo cocina. Tres cosas y listo.</p>
    </div>

    <section class="card stack-sm">
      <label class="field">
        <span>¿Qué lunes empiezas?</span>
        <input class="input" type="date" :value="start" @change="setStart" />
      </label>
      <p class="small muted">Semana 1 del ciclo: {{ formatLong(fromISO(start)) }}.</p>
    </section>

    <section class="card stack-sm">
      <h3>¿Qué día cocinas?</h3>
      <div class="seg">
        <button :class="{ on: cookDay === 'viernes' }" @click="cookDay = 'viernes'">Viernes</button>
        <button :class="{ on: cookDay === 'domingo' }" @click="cookDay = 'domingo'">Domingo</button>
      </div>
      <p class="small muted">El viernes siempre es día de compra.</p>
    </section>

    <section class="card stack-sm">
      <h3>¿Para cuántos?</h3>
      <div class="seg">
        <button :class="{ on: servings === 1 }" @click="servings = 1">Solo yo</button>
        <button :class="{ on: servings === 2 }" @click="servings = 2">Con mi padre</button>
      </div>
    </section>

    <button class="btn primary big" @click="go">Empezar</button>
  </main>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 18px 0 6px;
}
.logo {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 8px;
}
.hero p {
  margin-top: 6px;
}
.big {
  min-height: 62px;
  font-size: 20px;
}
</style>

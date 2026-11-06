<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { findRecipe } from '../data'
import { state } from '../store'
import { formatQty } from '../lib/qty'
import { scaleRecipe } from '../lib/shopping'

const route = useRoute()
const recipe = computed(() => findRecipe(String(route.params.id)))

// Raciones: por defecto las de la receta (×2 si cocino también para mi padre)
const base = computed(() => (recipe.value ? recipe.value.tuppers * state.settings.servings : 1))
const options = computed(() => {
  const r = recipe.value
  if (!r) return []
  const set = r.type === 'comodin' ? [1, 2, 4] : [3, 4, 6]
  if (set.indexOf(base.value) < 0) set.push(base.value)
  return set.sort((a, b) => a - b)
})
const raciones = ref(base.value)
watch(base, v => (raciones.value = v))
const ingredients = computed(() => (recipe.value ? scaleRecipe(recipe.value, raciones.value) : []))
const typeLabel = computed(() => (recipe.value ? (recipe.value.type === 'horno' ? 'Horno' : recipe.value.type === 'salsa' ? 'Salsa' : 'Comodín') : ''))
</script>

<template>
  <main v-if="recipe" class="page stack">
    <div class="topbar">
      <router-link to="/recetas" class="btn ghost small back">‹ Recetas</router-link>
    </div>
    <header class="stack-sm">
      <span class="chip" :class="recipe.type">{{ typeLabel }}</span>
      <h1>{{ recipe.name }}</h1>
      <p class="muted">~{{ recipe.minutes }} min · {{ recipe.type === 'comodin' ? '1 ración' : recipe.tuppers + ' tuppers' }}<template v-if="recipe.tag"> · {{ recipe.tag }}</template></p>
    </header>

    <section class="card stack-sm">
      <div class="spread">
        <h2>Ingredientes</h2>
      </div>
      <div class="seg" role="radiogroup" aria-label="Raciones">
        <button v-for="o in options" :key="o" :class="{ on: raciones === o }" role="radio" :aria-checked="raciones === o" @click="raciones = o">{{ o }}</button>
      </div>
      <p class="tiny muted">{{ recipe.type === 'comodin' ? 'Raciones' : 'Tuppers' }}: las cantidades se recalculan solas.</p>
      <ul class="ings">
        <li v-for="i in ingredients" :key="i.id + (i.unit || '')">
          <span class="grow">{{ i.name }}<span v-if="i.optional" class="muted"> (opcional)</span><span v-if="i.note" class="muted small"> · {{ i.note }}</span></span>
          <b v-if="i.qty !== undefined">{{ formatQty(i.qty, i.unit) }}</b>
        </li>
      </ul>
    </section>

    <section class="card stack-sm">
      <h2>Pasos</h2>
      <ol class="steps">
        <li v-for="(s, n) in recipe.steps" :key="n">
          <span class="num">{{ n + 1 }}</span>
          <span class="grow">{{ s.text }}<span v-if="s.timerMin" class="chip t">⏱ {{ s.timerMin }} min</span></span>
        </li>
      </ol>
      <div v-for="n in recipe.notes || []" :key="n" class="note">💡 {{ n }}</div>
    </section>

    <router-link :to="{ path: '/cocinar', query: { receta: recipe.id } }" class="btn primary">👨‍🍳 Cocinar esta receta</router-link>
  </main>
  <main v-else class="page">
    <h1>No encuentro esa receta</h1>
    <router-link to="/recetas" class="btn" style="margin-top: 16px">Ver recetas</router-link>
  </main>
</template>

<style scoped>
.back {
  margin-left: -10px;
}
.ings {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ings li {
  display: flex;
  align-items: baseline;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.ings li b {
  margin-left: 12px;
  white-space: nowrap;
}
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
}
.steps li {
  display: flex;
  align-items: flex-start;
}
.steps li + li {
  margin-top: 14px;
}
.num {
  flex: 0 0 32px;
  height: 32px;
  border-radius: 99px;
  background: var(--surface-2);
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}
.chip.t {
  margin-left: 8px;
  vertical-align: 2px;
  text-transform: none;
}
.note {
  background: var(--surface-2);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 16px;
}
</style>

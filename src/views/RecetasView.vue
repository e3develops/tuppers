<script setup lang="ts">
import { DATA, getRecipe } from '../data'
import { cycleWeek, prepPlan } from '../lib/day'
import { state } from '../store'

const weeks = (['1', '2', '3'] as const).map(w => ({
  n: Number(w),
  dishes: [getRecipe(DATA.ciclo[w].plato1), getRecipe(DATA.ciclo[w].plato2)],
}))
const comodin = getRecipe(DATA.comodin)
const typeLabel = (t: string) => (t === 'horno' ? 'Horno' : t === 'salsa' ? 'Salsa' : 'Comodín')
</script>

<template>
  <main class="page stack">
    <header>
      <h1>Recetas</h1>
      <p class="muted">El ciclo de 3 semanas y el comodín.</p>
    </header>

    <section v-for="w in weeks" :key="w.n" class="stack-sm">
      <h3 class="wk">
        Semana {{ w.n }}
        <span v-if="cycleWeek === w.n" class="chip green">Esta semana</span>
        <span v-else-if="prepPlan && prepPlan.semana === w.n" class="chip">La próxima</span>
      </h3>
      <router-link v-for="(r, i) in w.dishes" :key="r.id" :to="'/recetas/' + r.id" class="card rec" :class="r.type">
        <span class="bar" aria-hidden="true"></span>
        <span class="grow">
          <span class="chip" :class="r.type">Plato {{ i + 1 }} · {{ typeLabel(r.type) }}</span>
          <b>{{ r.name }}</b>
          <span class="small muted">{{ r.tuppers * state.settings.servings }} tuppers · ~{{ r.minutes }} min<template v-if="r.tag"> · {{ r.tag }}</template></span>
        </span>
        <span class="arrow">›</span>
      </router-link>
    </section>

    <section class="stack-sm">
      <h3 class="wk">Comodín</h3>
      <router-link :to="'/recetas/' + comodin.id" class="card rec comodin">
        <span class="bar" aria-hidden="true"></span>
        <span class="grow">
          <span class="chip comodin">Fuera del ciclo</span>
          <b>{{ comodin.name }}</b>
          <span class="small muted">1 ración · {{ comodin.minutes }} min · para cuando no hay tupper</span>
        </span>
        <span class="arrow">›</span>
      </router-link>
    </section>
  </main>
</template>

<style scoped>
.wk {
  display: flex;
  align-items: center;
  margin: 6px 0 2px 2px;
}
.wk .chip {
  margin-left: 10px;
}
.rec {
  display: flex;
  align-items: center;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  padding-left: 20px;
}
.rec .bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: var(--ink-3);
}
.rec.horno .bar {
  background: var(--orange);
}
.rec.salsa .bar {
  background: var(--red);
}
.rec b,
.rec .small {
  display: block;
}
.rec b {
  font-size: 20px;
  margin-top: 6px;
  line-height: 1.25;
}
.arrow {
  font-size: 30px;
  color: var(--ink-3);
  margin-left: 8px;
}
</style>

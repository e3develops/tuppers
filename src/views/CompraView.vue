<script setup lang="ts">
import { computed, ref } from 'vue'
import { DATA } from '../data'
import { SECTION_ORDER, type Section } from '../data/types'
import { state, weekShopping } from '../store'
import { formatShort } from '../lib/dates'
import { prepMonday, prepPlan, prepShopping, prepWeekISO, weekEnd } from '../lib/day'
import { formatQty } from '../lib/qty'
import type { ListItem } from '../lib/shopping'
import { showToast } from '../lib/toast'

const list = computed(() => prepShopping.value)
const groups = computed(() => {
  const out: { section: Section; items: ListItem[] }[] = []
  for (const s of SECTION_ORDER) {
    const items = list.value.items.filter(i => i.section === s)
    if (!items.length) continue
    // Lo tachado baja al final de su sección
    items.sort((a, b) => Number(!!list.value.checked[a.key]) - Number(!!list.value.checked[b.key]))
    out.push({ section: s, items })
  }
  return out
})
const pct = computed(() => (list.value.total ? Math.round((list.value.done / list.value.total) * 100) : 0))
const complete = computed(() => list.value.total > 0 && list.value.done === list.value.total)
const haveList = computed(() => DATA.despensa.filter(p => state.pantryHave[p.id]))

function toggle(item: ListItem) {
  const ws = weekShopping(prepWeekISO.value)
  if (ws.checked[item.key]) delete ws.checked[item.key]
  else ws.checked[item.key] = true
}
function pantryId(item: ListItem) {
  return item.key.split('|')[1]
}
function meQueda(item: ListItem) {
  const id = pantryId(item)
  state.pantryHave[id] = true
  showToast(`${item.name}: lo tienes en casa`, 'Deshacer', () => delete state.pantryHave[id])
}
function seAcabo(id: string, name: string) {
  delete state.pantryHave[id]
  showToast(`${name} vuelve a la lista`)
}

// Añadir un producto suelto
const newName = ref('')
const newSection = ref<Section>('Otros')
function add() {
  const name = newName.value.trim()
  if (!name) return
  weekShopping(prepWeekISO.value).manual.push({ id: String(Date.now()), name: name.charAt(0).toUpperCase() + name.slice(1), section: newSection.value })
  newName.value = ''
}
function removeManual(item: ListItem) {
  const ws = weekShopping(prepWeekISO.value)
  const id = item.key.split('|')[1]
  ws.manual = ws.manual.filter(m => m.id !== id)
  delete ws.checked[item.key]
}
function recipeNames(item: ListItem) {
  return item.recipes
    .filter(r => r !== 'fijos')
    .map(id => DATA.recetas.filter(x => x.id === id)[0]?.name)
    .filter(Boolean)
    .join(' · ')
}
</script>

<template>
  <main class="page stack">
    <header>
      <h1>Compra</h1>
      <p class="muted">
        <template v-if="prepPlan">Semana {{ prepPlan.semana }} · del lunes {{ formatShort(prepMonday) }} al sábado {{ formatShort(weekEnd(prepMonday)) }}</template>
        <template v-else>Modo puente: aún no empieza el ciclo. Solo fijos y despensa.</template>
      </p>
      <p v-if="prepPlan" class="small muted">{{ prepPlan.plato1.name }} + {{ prepPlan.plato2.name }}{{ state.settings.servings === 2 ? ' · con tu padre (×2)' : '' }}</p>
    </header>

    <div class="progress card tight" :class="{ ok: complete }">
      <div class="spread">
        <b>{{ complete ? 'Compra hecha ✓' : list.done + ' de ' + list.total }}</b>
        <span class="muted small">{{ pct }}%</span>
      </div>
      <div class="bar"><i :style="{ width: pct + '%' }"></i></div>
    </div>

    <section v-for="g in groups" :key="g.section" class="sec">
      <h3 class="sec-title">{{ g.section }}</h3>
      <ul class="items">
        <li
          v-for="i in g.items"
          :key="i.key"
          v-longpress="() => (i.pantry ? meQueda(i) : i.manual ? removeManual(i) : undefined)"
          class="item"
          :class="{ done: list.checked[i.key], pantry: i.pantry }"
          @click="toggle(i)"
        >
          <span class="check" aria-hidden="true">{{ list.checked[i.key] ? '✓' : '' }}</span>
          <span class="grow">
            <span class="i-name">{{ i.name }}<span v-if="i.optional" class="opt"> (opcional)</span></span>
            <span v-if="i.pantry && !list.checked[i.key]" class="i-sub">¿Te queda?</span>
            <span v-else-if="i.note" class="i-sub">{{ i.note }}</span>
            <span v-else-if="recipeNames(i)" class="i-sub">{{ recipeNames(i) }}</span>
          </span>
          <span v-if="i.qty !== undefined" class="i-qty">{{ formatQty(i.qty, i.unit) }}</span>
          <button v-if="i.pantry && !list.checked[i.key]" class="queda" @click.stop="meQueda(i)">Me queda</button>
          <button v-if="i.manual" class="queda" aria-label="Quitar" @click.stop="removeManual(i)">✕</button>
        </li>
      </ul>
    </section>

    <section class="card stack-sm">
      <h3>Añadir un producto</h3>
      <form class="stack-sm" @submit.prevent="add">
        <input v-model="newName" class="input" placeholder="Por ejemplo: papel de horno" enterkeyhint="done" />
        <select v-model="newSection" class="input" aria-label="Sección">
          <option v-for="s in SECTION_ORDER" :key="s" :value="s">{{ s }}</option>
        </select>
        <button class="btn primary" type="submit" :disabled="!newName.trim()">Añadir</button>
      </form>
    </section>

    <section v-if="haveList.length" class="card stack-sm">
      <h3>🏠 Tienes en casa</h3>
      <p class="small muted">No salen en la lista. Toca uno cuando se acabe.</p>
      <div class="have">
        <button v-for="p in haveList" :key="p.id" v-longpress="() => seAcabo(p.id, p.name)" class="have-chip" @click="seAcabo(p.id, p.name)">{{ p.name }} · Se ha acabado</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.progress .bar {
  height: 10px;
  border-radius: 99px;
  background: var(--surface-2);
  overflow: hidden;
  margin-top: 8px;
}
.progress .bar i {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.3s ease;
}
.progress.ok {
  border-color: rgba(66, 211, 146, 0.5);
  background: var(--green-bg);
}
.progress.ok b {
  color: var(--green);
}
.progress.ok .bar i {
  background: var(--green);
}
.sec-title {
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  margin: 6px 0 8px 4px;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}
.item {
  display: flex;
  align-items: center;
  min-height: 62px;
  padding: 10px 12px 10px 12px;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
.item + .item {
  border-top: 1px solid var(--line);
}
.check {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 2.5px solid var(--ink-3);
  margin-right: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 20px;
  color: #06281a;
}
.item.done .check {
  background: var(--green);
  border-color: var(--green);
}
.i-name {
  display: block;
  font-weight: 700;
}
.i-sub {
  display: block;
  font-size: 14px;
  color: var(--ink-3);
}
.opt {
  font-weight: 600;
  color: var(--ink-3);
  font-size: 15px;
}
.i-qty {
  flex: 0 0 auto;
  margin-left: 10px;
  font-weight: 800;
  color: var(--ink-2);
  white-space: nowrap;
}
.item.done .i-name,
.item.done .i-qty {
  text-decoration: line-through;
  color: var(--ink-3);
}
.item.pantry:not(.done) .i-name,
.item.pantry:not(.done) .i-qty {
  color: var(--ink-3);
}
.item.pantry:not(.done) .check {
  border-style: dashed;
}
.queda {
  flex: 0 0 auto;
  margin-left: 10px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink-2);
  font-weight: 800;
  font-size: 15px;
}
.have {
  display: flex;
  flex-wrap: wrap;
  margin: -4px;
}
.have-chip {
  margin: 4px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--surface-2);
  font-weight: 700;
  font-size: 15px;
  color: var(--ink-2);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { DATA, getRecipe } from '../data'
import { SECTION_ORDER, type Section } from '../data/types'
import { state, weekShopping } from '../store'
import { addDays, formatShort, toISO } from '../lib/dates'
import { plural, prepMonday, settingsFor, shoppingFor, today, weekEnd } from '../lib/day'
import { weekPlan } from '../lib/plan'
import { formatQty } from '../lib/qty'
import type { ListItem } from '../lib/shopping'
import { showToast } from '../lib/toast'

// De lunes a jueves se puede echar un vistazo a la lista de la semana siguiente
const dow = computed(() => today.value.getDay())
const canPeekNext = computed(() => dow.value >= 1 && dow.value <= 4)
const peekNext = ref(false)
const monday = computed(() => (peekNext.value && canPeekNext.value ? addDays(prepMonday.value, 7) : prepMonday.value))
const weekISO = computed(() => toISO(monday.value))
const plan = computed(() => weekPlan(monday.value, settingsFor(monday.value), DATA, getRecipe))
const list = computed(() => shoppingFor(weekISO.value, plan.value ? [plan.value.plato1, plan.value.plato2] : []))

// Lo recién marcado se queda un momento en su sitio antes de bajar al final de la sección
const settling = ref<Record<string, boolean>>({})
const isChecked = (i: ListItem) => !!list.value.checked[i.key]
const groups = computed(() => {
  const out: { section: Section; items: ListItem[] }[] = []
  for (const s of SECTION_ORDER) {
    const items = list.value.items.filter(i => i.section === s)
    if (!items.length) continue
    const sinks = (i: ListItem) => isChecked(i) && !settling.value[i.key]
    items.sort((a, b) => Number(sinks(a)) - Number(sinks(b)))
    out.push({ section: s, items })
  }
  return out
})
const pct = computed(() => (list.value.total ? Math.round((list.value.done / list.value.total) * 100) : 0))
const complete = computed(() => list.value.total > 0 && list.value.done === list.value.total)
const haveList = computed(() => DATA.despensa.filter(p => state.pantryHave[p.id]))

function toggle(item: ListItem) {
  const wasChecked = isChecked(item)
  if (item.manual) {
    const m = state.manualItems.filter(x => 'manual|' + x.id === item.key)[0]
    if (m) m.boughtWeek = wasChecked ? undefined : weekISO.value
  } else {
    const ws = weekShopping(weekISO.value)
    if (wasChecked) delete ws.checked[item.key]
    else ws.checked[item.key] = true
  }
  if (!wasChecked) {
    settling.value = { ...settling.value, [item.key]: true }
    setTimeout(() => {
      const next = { ...settling.value }
      delete next[item.key]
      settling.value = next
    }, 900)
  }
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
  showToast(`${name} vuelve a la lista`, 'Deshacer', () => (state.pantryHave[id] = true))
}

// Añadir un producto suelto (se queda en la lista hasta que lo compres)
const newName = ref('')
const newSection = ref<Section>('Otros')
function add() {
  const name = newName.value.trim()
  if (!name) return
  state.manualItems.push({ id: String(Date.now()), name: name.charAt(0).toUpperCase() + name.slice(1), section: newSection.value })
  newName.value = ''
}
function removeManual(item: ListItem) {
  const idx = state.manualItems.findIndex(m => 'manual|' + m.id === item.key)
  if (idx < 0) return
  const [removed] = state.manualItems.splice(idx, 1)
  showToast(`Quitado: ${removed.name}`, 'Deshacer', () => state.manualItems.splice(idx, 0, removed))
}
function recipeNames(item: ListItem) {
  return item.recipes
    .filter(r => r !== 'fijos')
    .map(id => DATA.recetas.filter(x => x.id === id)[0]?.name)
    .filter(Boolean)
    .join(' · ')
}
function onKey(e: KeyboardEvent, i: ListItem) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle(i)
  }
}
</script>

<template>
  <main class="page stack">
    <header>
      <h1>Compra</h1>
      <p class="muted">
        <template v-if="plan">Semana {{ plan.semana }} · del lunes {{ formatShort(monday) }} al sábado {{ formatShort(weekEnd(monday)) }}</template>
        <template v-else>Modo puente: aún no empieza el ciclo. Solo fijos y despensa.</template>
      </p>
      <p v-if="plan" class="small muted">{{ plan.plato1.name }} + {{ plan.plato2.name }}{{ state.settings.servings === 2 ? ' · con tu padre (×2)' : '' }}</p>
      <div v-if="canPeekNext" class="seg week-seg">
        <button :class="{ on: !peekNext }" @click="peekNext = false">Esta semana</button>
        <button :class="{ on: peekNext }" @click="peekNext = true">La que viene</button>
      </div>
    </header>

    <div class="progress card tight" :class="{ ok: complete }">
      <div class="spread">
        <b>{{ complete ? 'Compra hecha ✓' : list.done + ' de ' + plural(list.total, 'producto', 'productos') }}</b>
        <span class="muted small">{{ pct }}%</span>
      </div>
      <div class="bar"><i :style="{ width: pct + '%' }"></i></div>
      <p class="tiny muted hint">La despensa (en gris) no cuenta: márcala solo si la compras.</p>
    </div>

    <section v-for="g in groups" :key="g.section" class="sec">
      <h3 class="sec-title">{{ g.section }}</h3>
      <ul class="items">
        <li
          v-for="i in g.items"
          :key="i.key"
          v-longpress="i.pantry && !isChecked(i) ? () => meQueda(i) : i.manual ? () => removeManual(i) : null"
          class="item"
          :class="{ done: isChecked(i), pantry: i.pantry }"
          role="checkbox"
          :aria-checked="isChecked(i)"
          tabindex="0"
          @click="toggle(i)"
          @keydown="onKey($event, i)"
        >
          <span class="check" aria-hidden="true">{{ isChecked(i) ? '✓' : '' }}</span>
          <span class="grow">
            <span class="i-name">{{ i.name }}<span v-if="i.optional" class="opt"> (opcional)</span></span>
            <span v-if="i.pantry && !isChecked(i)" class="i-sub">¿Te queda?<span v-if="i.qty !== undefined" class="nw"> · {{ formatQty(i.qty, i.unit) }}</span></span>
            <span v-else-if="i.manual" class="i-sub">Añadido a mano</span>
            <span v-else-if="i.note" class="i-sub">{{ i.note }}</span>
            <span v-else-if="recipeNames(i)" class="i-sub">{{ recipeNames(i) }}</span>
          </span>
          <span v-if="i.qty !== undefined && !(i.pantry && !isChecked(i))" class="i-qty">{{ formatQty(i.qty, i.unit) }}</span>
          <button v-if="i.pantry && !isChecked(i)" class="queda" @click.stop="meQueda(i)">Me queda</button>
          <button v-if="i.manual" class="queda" :aria-label="'Quitar ' + i.name" @click.stop="removeManual(i)">✕</button>
        </li>
      </ul>
    </section>

    <section class="card stack-sm">
      <h3>Añadir un producto</h3>
      <p class="small muted">Se queda en la lista hasta que lo compres, aunque cambie la semana.</p>
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
        <button v-for="p in haveList" :key="p.id" class="have-chip" @click="seAcabo(p.id, p.name)">{{ p.name }} · Se ha acabado</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.week-seg {
  margin-top: 12px;
}
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
.progress .hint {
  margin-top: 6px;
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
  padding: 10px 12px;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}
.item:focus {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
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
  word-wrap: break-word;
}
.i-sub {
  display: block;
  font-size: 14px;
  color: var(--ink-3);
}
.nw {
  white-space: nowrap;
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
.item.pantry:not(.done) .i-name {
  color: var(--ink-3);
}
.item.pantry:not(.done) .check {
  border-style: dashed;
}
.queda {
  flex: 0 0 auto;
  margin-left: 8px;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink-2);
  font-weight: 800;
  font-size: 15px;
  white-space: nowrap;
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

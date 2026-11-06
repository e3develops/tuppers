<script setup lang="ts">
import { computed } from 'vue'
import type { Recipe } from '../data/types'
import { reheatFor } from '../lib/reheat'

const props = withDefaults(defineProps<{ recipe: Recipe; frozen?: boolean }>(), { frozen: true })
const info = computed(() => reheatFor(props.recipe, props.frozen))
</script>

<template>
  <div class="reheat">
    <h3 class="rh-title">🔥 Cómo recalentar</h3>
    <div v-for="o in info.options" :key="o.title" class="rh-opt" :class="{ rec: o.recommended }">
      <div class="rh-head">
        <b>{{ o.title }}</b>
        <span v-if="o.recommended" class="chip green">Recomendado</span>
      </div>
      <p>{{ o.text }}</p>
    </div>
    <p v-if="info.onlyNote" class="small muted rh-only">{{ info.onlyNote }}</p>
    <p v-if="info.rice" class="rh-rice">🍚 {{ info.rice }}</p>
    <ul class="rh-notes">
      <li v-for="n in info.notes" :key="n">{{ n }}</li>
    </ul>
  </div>
</template>

<style scoped>
.reheat > * + * {
  margin-top: 10px;
}
.rh-title {
  font-size: 17px;
}
.rh-opt {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 14px;
  padding: 12px 14px;
}
.rh-opt.rec {
  border: 1px solid rgba(66, 211, 146, 0.35);
}
.rh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}
.rh-head b {
  font-size: 18px;
}
.rh-head .chip {
  margin-left: 8px;
  flex: 0 0 auto;
}
.rh-rice {
  font-size: 16px;
  color: var(--ink-2);
}
.rh-notes {
  margin: 0;
  padding: 0 0 0 18px;
  font-size: 14px;
  color: var(--ink-3);
}
.rh-notes li + li {
  margin-top: 4px;
}
</style>

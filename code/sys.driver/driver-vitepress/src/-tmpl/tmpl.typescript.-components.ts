/**
 * Index: global component registration.
 */
export const index = `
import type { EnhanceAppContext } from 'vitepress';
import Sample from './Sample.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  console.log('registerComponents:', ctx);
  ctx.app.component('Sample', Sample);  
}
`.slice(1);

/**
 * Sample Vue component.
 */
const Sample = `
<template>
  <div @click="increment" class="counter-box" :style="{ cursor: 'pointer' }">
    <div>increment: {{ count }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'SimpleCounter',
  setup() {
    const count = ref(0);
    const increment = () => count.value++;
    return { count, increment };
  },
});
</script>

<style scoped>
.counter-box {
  background-color: rgba(255, 0, 0, 0.1);
  padding: 12px;
  user-select: none;
}
</style>
`.slice(1);

export const Components = { index, Sample } as const;

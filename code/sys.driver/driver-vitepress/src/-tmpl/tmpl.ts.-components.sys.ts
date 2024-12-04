/**
 * Index: global component registration.
 */
export const index = `
import type { EnhanceAppContext } from 'vitepress';
import VimeoPlayer from './VimeoPlayer.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  ctx.app.component('VimeoPlayer', VimeoPlayer);  
}
`.slice(1);

/**
 * Sample Vimeo video player
 */
const VimeoPlayer = `
<template>
  <div @click="increment" class="counter-box" :style="{ cursor: 'pointer' }">
    <div>Vimeo (Video Player): {{ id }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'VimeoPlayer',
  props: {
    id: { type: String },
  },
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
  user-select: none;
  margin-top: 5px;
  padding: 12px;
}
</style>
`.slice(1);

export const Sys = {
  index,
  VimeoPlayer,
} as const;

/**
 * Index: global component registration.
 */
export const index = `
import type { EnhanceAppContext } from 'vitepress';
import Video from './VideoPlayer.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  ctx.app.component('Video', Video);  
}
`.slice(1);

/**
 * Sample VimeoVime multi-purpose video player.
 * https://vidstack.io/docs
 */
const VideoPlayer = `
<template>
  <div class="root">
    <div>Vime Player</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'VimePlayer',
  setup() {
    console.log('Setup');
  },
});
</script>

<style scoped>
.root {
  background-color: rgba(255, 0, 0, 0.1);
  padding: 12px;
  margin-top: 5;
}
</style>
`.slice(1);

export const Sys = {
  index,
  VideoPlayer,
} as const;

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
export const VideoPlayer = `
<template>
  <div class="root">
    <div>🐷 Video Player (WIP)</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

const name = 'VideoPlayer';
export default defineComponent({
  name,
  setup() {
    console.log('Setup:', name);
  },
});
</script>

<style scoped>
.root {
  background-color: rgba(255, 0, 0, 0.1);
  padding: 12px;
  margin-top: 5px;
}
</style>
`;

export const ReactWrapper = `
<template>
  <!-- This is where the React component will be mounted -->
  <div ref="reactRoot"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import React from 'react-dom';
import ReactDOM from 'react-dom/client';
import { MyReactComponent } from './ReactWrapper.Sample.ts';

const reactRoot = ref<HTMLElement | null>(null);
let root: ReactDOM.Root | null = null;

onMounted(() => {
  if (reactRoot.value) {
    // Create the React root and render the React component
    root = ReactDOM.createRoot(reactRoot.value);
    // root.render(<MyReactComponent />);
    // React.cloneElement()
    // root.render();
    console.log('root', root);
  }
});

onBeforeUnmount(() => {
  if (root) {
    root.unmount();
  }
});
</script>

<script lang="ts">
import { defineComponent, ref } from 'vue';

const name = 'VideoPlayer';
export default defineComponent({
  name,
  setup() {
    console.log('Setup:', name);
  },
});
</script>

<style scoped>
/* Optional styling */
</style>
`;

export const ReactWrapperSample = `

`;

export const Sys = {
  index,
  VideoPlayer,
  ReactWrapper,
  ReactWrapperSample,
} as const;

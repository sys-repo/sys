/**
 * Index: global component registration.
 */
export const index = `
import type { EnhanceAppContext } from 'vitepress';

import ReactWrapper from './ReactWrapper.vue';
import Video from './VideoPlayer.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  ctx.app.component('Video', Video);  
  ctx.app.component('ReactWrapper', ReactWrapper);
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
  <div ref="reactRoot"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MyComponent } from './ReactWrapper.Sample';

const reactRoot = ref<HTMLElement | null>(null);
let root: ReactDOM.Root | null = null;

onMounted(() => {
  if (reactRoot.value) {
    const el = React.createElement(MyComponent, { count: 123 });
    root = ReactDOM.createRoot(reactRoot.value);
    root.render(el);
  }
});

onBeforeUnmount(() => {
  root?.unmount();
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
import React from 'react';

export type MyComponentProps = {
  count?: number;
};

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  console.log('MyComponent.props:', props);
  return (
    <div style={{ marginTop: 5, padding: 10, backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */ }}>
      <div>Hello from React 👋</div>
    </div>
  );
};
`;

export const Sys = {
  index,
  VideoPlayer,
  ReactWrapper,
  ReactWrapperSample,
} as const;

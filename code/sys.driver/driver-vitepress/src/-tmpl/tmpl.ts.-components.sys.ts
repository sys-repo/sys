/**
 * Index: global component registration.
 */
export const index = `
import type { EnhanceAppContext } from 'vitepress';

import ReactWrapper from './ReactWrapper.vue';
import Video from './Video.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  ctx.app.component('Video', Video);
  ctx.app.component('ReactWrapper', ReactWrapper);
}
`.slice(1);

/**
 * Sample VimeoVime multi-purpose video player.
 * https://vidstack.io/docs
 */
export const VideoVue = `
<template>
  <div ref="reactRoot"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Video } from './Video';

const reactRoot = ref<HTMLElement | null>(null);
let root: ReactDOM.Root | null = null;

onMounted(() => {
  if (reactRoot.value) {
    const el = React.createElement(Video, {});
    root = ReactDOM.createRoot(reactRoot.value);
    root.render(el);
  }
});

onBeforeUnmount(() => {
  root?.unmount();
});
</script>

<style scoped>
</style>
`;

export const VideoTsx = `
import React from 'react';

import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

export type VideoProps = {
  src?: string;
};

export const Video: React.FC<VideoProps> = (props: VideoProps) => {
  console.log('VideoPlayer.tsx', props);
  return (
    <MediaPlayer title="Sprite Fight" src={'vimeo/727951677'}>
      <MediaProvider />
      <PlyrLayout
        thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
        icons={plyrLayoutIcons}
      />
    </MediaPlayer>
  );
};
`;

export const ReactWrapper = `
<template>
  <div ref="reactRoot" class="root"></div>
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

<style scoped>
.root {
  padding-bottom: 10px;
}
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
  VideoVue,
  VideoTsx,
  ReactWrapper,
  ReactWrapperSample,
} as const;

/**
 * Index: global component registration.
 */
export const index = `
import type { EnhanceAppContext } from 'vitepress';

import ReactWrapper from './React.Wrapper.vue';
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
  <div ref="root" class="root"></div>
</template>

<script setup lang="ts">
import { setup, ref } from './React.setup';
import { Video } from './Video';

type VideoProps = { title?: string; src?: string };
const root = ref();
const props = defineProps<VideoProps>();
setup(root, Video, props);
</script>

<style scoped>
.root {
  padding-bottom: 10px;
}
</style>
`;

export const VideoTsx = `
import React from 'react';

import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

export type VideoProps = {
  title?: string;
  src?: string;
};

/**
 * Component
 */
export const Video: React.FC<VideoProps> = (props: VideoProps) => {
  const src = props.src || DEFAULTS.src;
  return (
    <MediaPlayer title={props.title} src={src}>
      <MediaProvider />
      <PlyrLayout
        // thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
        icons={plyrLayoutIcons}
      />
    </MediaPlayer>
  );
};

/**
 * Constants
 */
export const DEFAULTS = {
  src: 'vimeo/499921561', // Tubes.
} as const;
`;

export const ReactWrapper = `
<template>
  <div ref="root"></div>
</template>

<script setup lang="ts">
import { setup, ref } from './React.setup';
import { MyComponent } from './React.Wrapper.Sample';

const root = ref();
setup(root, MyComponent, { count: 1234 });
</script>

<style scoped></style>
`;

export const ReactSetup = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { onBeforeUnmount, onMounted, ref as vueRef, type Ref } from 'vue';

type O = Record<string, unknown>;

export const ref = () => vueRef<HTMLElement | undefined>();

/**
 * Setup a react-in-vue wrapper.
 */
export function setup<P extends O>(
  refRoot: Ref<HTMLElement | undefined>,
  Component: React.FC<P>,
  props?: P,
) {
  let root: ReactDOM.Root | undefined;

  onMounted(() => {
    if (refRoot.value) {
      const el = React.createElement(Component, props);
      root = ReactDOM.createRoot(refRoot.value);
      root.render(el);
    }
  });

  onBeforeUnmount(() => {
    root?.unmount();
  });
}
`;

export const ReactSample = `
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
  ReactSetup,
  ReactWrapper,
  ReactSample,
} as const;

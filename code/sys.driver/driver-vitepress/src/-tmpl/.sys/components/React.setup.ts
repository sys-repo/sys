import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { onBeforeUnmount, onMounted, ref as vueRef, type Ref } from 'vue';
import { NotFound } from './React.NotFound.tsx';

type O = Record<string, unknown>;
export const ref = () => vueRef<HTMLElement | undefined>();

/**
 * Setup a <react-in-vue> wrapper component.
 */
export function setup<P extends O>(
  refRoot: Ref<HTMLElement | undefined>,
  props: P,
  getComponent: () => Promise<React.FC<P> | undefined>,
) {
  type C = React.FC<P>;
  let root: Root | undefined;

  onMounted(async () => {
    if (refRoot.value) {
      const Component = ((await getComponent()) || NotFound) as C;
      const el = React.createElement(Component, props);
      root = createRoot(refRoot.value);
      root.render(el);
    }
  });

  onBeforeUnmount(() => root?.unmount());
}

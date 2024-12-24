
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

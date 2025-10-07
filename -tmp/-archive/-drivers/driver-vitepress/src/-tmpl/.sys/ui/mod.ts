import type { EnhanceAppContext } from 'vitepress';
import React from './React.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  ctx.app.component('React', React);
}

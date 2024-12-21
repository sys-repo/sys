import type { EnhanceAppContext } from 'vitepress';

import ReactWrapper from './React.Wrapper.vue';
import Video from './Video.vue';

export function registerComponents(ctx: EnhanceAppContext) {
  ctx.app.component('Video', Video);
  ctx.app.component('ReactWrapper', ReactWrapper);
}

import type { Theme as ThemeType } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import { registerComponents as registerSystemComponents } from '../../.sys/ui/mod.ts';
import Layout from './Layout.vue';

export const Theme: ThemeType = {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    registerSystemComponents(ctx);
  },
};

export default Theme;

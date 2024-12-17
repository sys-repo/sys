import type { Theme as ThemeType } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import { registerComponents as registerSystemComponents } from '../../.sys/components/index.ts';

export const Theme: ThemeType = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    registerSystemComponents(ctx);
  },
};

export default Theme;

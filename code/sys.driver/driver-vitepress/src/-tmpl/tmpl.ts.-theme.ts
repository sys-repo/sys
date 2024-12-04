export const theme = `
import type { Theme as ThemeType } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { registerComponents as registerSystemComponents } from '../../.sys/components/index.ts';
import { registerComponents as registerUserlandComponents } from '../../src/components/index.ts';

export const Theme: ThemeType = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    registerSystemComponents(ctx);
    registerUserlandComponents(ctx);
  },
};

export default Theme;
`.slice(1);

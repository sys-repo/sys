export const theme = `
import type { Theme as ThemeType } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { registerComponents } from '../../src/components/index.ts';

export const Theme: ThemeType = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    registerComponents(ctx);
  },
};

export default Theme;
`.slice(1);

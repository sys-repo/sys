export const theme = `
import type { Theme as ThemeType } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { registerComponents as registerComponentsSystem } from '../../.sys/components/index.ts';
import { registerComponents as registerComponentsUser } from '../../src/components/index.ts';

export const Theme: ThemeType = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    registerComponentsSystem(ctx);
    registerComponentsUser(ctx);
  },
};

export default Theme;
`.slice(1);

import type { Theme as ThemeType } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import { registerComponents as registerSystemComponents } from '../../.sys/components/index.ts';
import { registerComponents as registerUserspaceComponents } from '../../src/components/index.ts';

export const Theme: ThemeType = {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    registerSystemComponents(ctx);
    registerUserspaceComponents(ctx);
  },
};

export default Theme;

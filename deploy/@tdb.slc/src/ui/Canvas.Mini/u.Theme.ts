import { type t, Color } from './common.ts';

export const Theme = {
  color(theme: t.CommonTheme = 'Light') {
    return theme === 'Dark' ? Color.WHITE : Color.DARK;
  },
} as const;

import { find } from './u.find.tsx';
import { render } from './u.render.ts';
import { showBackgroundColor } from './u.style.ts';

export const AppContent = {
  find,
  render,
  showBackgroundColor,
} as const;

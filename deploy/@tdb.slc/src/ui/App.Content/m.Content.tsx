import { find } from './m.Content.find.tsx';
import { render } from './m.Content.render.ts';
import { showBackgroundColor } from './m.Content.style.ts';

export const AppContent = {
  find,
  render,
  showBackgroundColor,
} as const;

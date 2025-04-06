import type { t } from './common.ts';
import { factory } from './m.Content.factory.tsx';
import { Render } from './m.Content.Render.ts';

export const AppContent = {
  Render,
  factory,
} as const;

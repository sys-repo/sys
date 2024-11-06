import { Keyboard as Base } from '@sys/ui-dom';
import { useKeyboardState } from './useKeyboardState.ts';

export const Keyboard = {
  ...Base,
  EventProps: () => import('./ui.EventProps.tsx'),
  useKeyboardState,
} as const;

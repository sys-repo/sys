import { SpinnerPuff as Puff } from './ui.Puff.tsx';
import { SpinnerBar as Bar } from './ui.Bar.tsx';
import { SpinnerOrbit as Orbit } from './ui.Orbit.tsx';
import { Center } from '../Center/mod.ts';

export const Spinner = {
  /**
   * Spinner Variants.
   */
  Puff,
  Bar,
  Orbit,

  /**
   * Helpers
   */
  Center,
} as const;

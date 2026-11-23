/**
 * @module
 * UI load spinners.
 */
import { BarSpinner } from '../Spinners.Bar/mod.ts';
import { CircularSpinner } from '../Spinners.Circular/mod.ts';
import type { t } from './common.ts';

/**
 * UI spinner renderer set.
 */
export const Spinners: t.SpinnerLib = {
  Bar: BarSpinner.UI,
  Circular: CircularSpinner.UI,
};

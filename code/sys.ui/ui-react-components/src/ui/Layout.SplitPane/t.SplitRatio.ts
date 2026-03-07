import { type t } from './common.ts';

/**
 * Common shape for split ratios + bounds.
 */
type SplitPaneRatiosCore = {
  readonly isControlled: boolean;
  readonly ratios: t.Percent[];
  readonly mins: t.Percent[];
  readonly maxs: t.Percent[];
};

/**
 * Updater method.
 */
export type UpdateRatios = (next: t.Percent[] | ((prev: t.Percent[]) => t.Percent[])) => void;

/**
 * Discriminated union: controlled vs uncontrolled.
 * - Controlled: no setter (external source of truth).
 * - Uncontrolled: exposes a setter for internal state updates.
 */
export type SplitPaneRatiosControlled = SplitPaneRatiosCore & {
  readonly isControlled: true;
};

export type SplitPaneRatiosUncontrolled = SplitPaneRatiosCore & {
  readonly isControlled: false;
  set: UpdateRatios; // explicit setter only when uncontrolled
};

export type SplitPaneRatios = SplitPaneRatiosControlled | SplitPaneRatiosUncontrolled;

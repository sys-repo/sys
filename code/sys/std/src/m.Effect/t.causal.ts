import type { t } from './common.ts';

/**
 * EffectController causal helpers (adapter protocol utilities).
 */
export type EffectCausalLib = {
  /**  */
  mirrorToken<T>(): t.EffectMirrorToken<T>;
};

/**
 * One-shot mirror token used to suppress feedback-loop echoes in causal bridges.
 */
export type EffectMirrorToken<T> = {
  mark(value: T): void;
  consume(value: T): boolean;
};

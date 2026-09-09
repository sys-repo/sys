import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.causal.ts';

/**
 * Effect primitives.
 */
export namespace Effect {
  /**
   * Minimal runtime surfaces for effect control and causal bridge helpers.
   */
  export type Lib = {
    readonly Causal: Causal.Lib;
    readonly Controller: t.EffectController.Lib;
  };

  /**
   * Effect causal helper contracts.
   */
  export namespace Causal {
    /**
     * Effect causal helpers (adapter protocol utilities).
     */
    export type Lib = {
      /** Create a one-shot mirror token used to suppress feedback-loop echoes in causal bridges. */
      mirrorToken<T>(): t.EffectMirrorToken<T>;
    };
  }
}

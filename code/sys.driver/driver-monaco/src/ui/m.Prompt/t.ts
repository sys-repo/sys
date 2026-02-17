import type { t } from './common.ts';

/**
 * Constrains Monaco into a prompt-style input
 * (1..n visible lines with controlled enter and overflow behavior).
 *
 * Pure controller logic lives here;
 * React hooks are thin lifecycle adapters only.
 */
export declare namespace EditorPrompt {
  export type Lib = {};

  /** Prompt behavior config for MonacoEditor. */
  export type Config = {
    /** Min/max visible line bounds. */
    readonly lines: Lines;
    /** Overflow behavior at max lines. */
    readonly overflow?: Overflow;
    /** Enter-key behavior mapping. */
    readonly enter?: EnterPolicy;
  };

  /** Visible line constraints. */
  export type Lines = {
    /** Minimum visible lines. */
    readonly min: number;
    /** Maximum visible lines. */
    readonly max: number;
  };

  /** Overflow policy once max lines is reached. */
  export type Overflow = 'scroll' | 'clamp';

  /** Enter-key action policy. */
  export type EnterPolicy = {
    /** Action for Enter. */
    readonly enter: 'submit' | 'newline';
    /** Action for modifier+Enter. */
    readonly modEnter: 'submit' | 'newline';
  };
}

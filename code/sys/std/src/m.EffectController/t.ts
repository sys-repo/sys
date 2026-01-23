import { type t } from './common.ts';

/**
 * EffectController — minimal orchestration primitive.
 */
export type EffectControllerLib = {
  create<State, Patch = Partial<State>>(
    args: t.EffectControllerCreateArgs<State, Patch>,
  ): t.EffectController<State, Patch>;
};

/**
 * Minimal injected ref surface (implementation detail).
 * Matches the subset of ImmutableRef needed by the kernel.
 */
export type EffectRef<State> = {
  readonly current: State;
  change(mutator: (draft: State) => void): void;
  events(dispose$: t.UntilInput): { readonly $: t.Observable<{ readonly after: State }> };
};

/**
 * Arguments for creating an EffectController.
 */
export type EffectControllerCreateArgs<State, Patch> = {
  readonly id?: t.StringId;
  readonly ref: EffectRef<State>;
  readonly applyPatch?: (draft: State, patch: Patch) => void;
};

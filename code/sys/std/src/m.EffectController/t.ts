import { type t } from './common.ts';

/**
 * EffectController — minimal orchestration primitive.
 */
export type EffectControllerLib = CreateMethod & {};

/** Create: factory overloads */
type CreateMethod = {
  create<State, Patch extends Partial<State> = Partial<State>, Props = undefined>(
    args: t.EffectControllerCreateArgs<State, Patch, Props> & { readonly applyPatch?: undefined },
  ): t.EffectController<State, Patch, Props>;
  create<State, Patch, Props = undefined>(
    args: t.EffectControllerCreateArgs<State, Patch, Props> & {
      readonly applyPatch: (draft: State, patch: Patch) => void;
    },
  ): t.EffectController<State, Patch, Props>;
};

/**
 * Minimal injected ref surface (implementation detail).
 * Matches the subset of ImmutableRef needed by the kernel.
 */
export type EffectRef<State> = {
  readonly current: State;
  change(mutator: (draft: State) => void): void;
  events(until: t.UntilInput): { readonly $: t.Observable<{ readonly after: State }> };
};

/**
 * Arguments for creating an EffectController.
 */
export type EffectControllerCreateArgs<State, Patch = Partial<State>, Props = undefined> = {
  readonly id?: t.StringId;
  readonly ref: EffectRef<State>;
  readonly applyPatch?: (draft: State, patch: Patch) => void;
  readonly isNoop?: (curr: State, patch: Patch | undefined) => boolean;
} & (Props extends undefined ? { readonly props?: never } : { readonly props: Props });

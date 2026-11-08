import type { t } from './common.ts';

/**
 * Shared CSS focus arrival, independent of component markup and interaction state.
 */
export declare namespace FocusStyle {
  /** Shared paint and terminal composition; apply compose(...).class without recomposition. */
  export type Lib = {
    /**
     * Standard outline: 1px root radius, opaque blue arrival, 20%-blue rest, 2px stroke and offset.
     * `prefix` owns the `-accent`, `-rest`, `-width` and `-offset` CSS tokens, reset per target.
     * Use a control-owned prefix, not the internal `--sys-focus-*` namespace.
     * Resting contrast is below 3:1 on white/Dark; callers own suitability for their surface.
     */
    outline(prefix: `--${string}`): Outline;
    /**
     * Compose an indicator activated by an ancestor's native :focus-visible binding.
     * `via` names an application-owned custom property; reserve it and `${via}-visible`
     * for the returned activation declarations. Do not use the internal `--sys-focus-*` prefix.
     */
    compose(input: Input & { via: `--${string}` }): Child;
    /**
     * Compose an element that paints its own native :focus-visible indicator.
     * A caller focus block (including an explicit clear) replaces the entire default policy.
     */
    compose(input: Input): Target;
  };

  /** All target styling enters here, before class-scoped preference rules are registered. */
  export type Input = {
    /** Lower-priority component layout, before default focus declarations. */
    base?: t.Style.Input;
    /**
     * Original caller input, applied last; root or supported pseudo-class animation makes default
     * focus static.
     */
    style?: t.Style.Input;
    paint: Paint;
  };

  /** Ordinary root geometry stays separate from replaceable focus paint. */
  export type Outline = {
    readonly base: { readonly borderRadius: number };
    readonly paint: Paint;
  };

  /** Component-owned paint; keep arrival and settled geometry identical. */
  export type Paint = {
    /** Per-target palette/geometry tokens, omitted when caller focus replaces the default. */
    defaults?: { [key: `--${string}`]: string | number };
    arrival: Pick<t.Style.Props, 'outlineColor' | 'boxShadow'>;
    settled: Pick<t.Style.Props, 'outline' | 'outlineOffset' | 'boxShadow' | 'textDecoration'>;
    /** A visible system-colour outline, not shadow alone; normal UA adjustment remains enabled. */
    forcedColors: Pick<t.Style.Props, 'outline' | 'outlineOffset' | 'boxShadow'>;
  };

  /** Terminal presentation result, not a recomposable CSS fragment. */
  export type Target = {
    readonly class: t.Style.Classname;
  };

  /** An indicator-only target: hidden without the ancestor binding, settled while active. */
  export type Child = Target & {
    /**
     * Spread onto the host; merge `activation[':focus-visible']` when adding host focus paint.
     * `css(...)` replaces nested blocks, so replacing this block removes child activation.
     */
    readonly activation: Activation;
  };

  /**
   * Ordinary inheritable declarations; apply on each host to isolate nested controls.
   * Native focus selects/removes the child's animation, not just its visibility.
   * Neutral wrappers preserve the binding; portals outside the ancestry do not.
   * Preference rules belong to the final child class, never to this composable binding.
   */
  export type Activation = Readonly<t.Style.Props> & {
    readonly ':focus-visible': Readonly<t.Style.Props>;
  };
}

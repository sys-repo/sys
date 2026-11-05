/**
 * @module
 * Shared CSS focus arrival; each control or indicator owns its paint.
 *
 * Without `via`, the target paints its own native `:focus-visible` indication.
 * With `via`, an ancestor's native `:focus-visible` activates a separate indicator.
 *
 * Immediate arrival paint → 70ms hold → 220ms ease-out to ordinary settled paint.
 * Reduced motion skips arrival; forced colours uses the supplied static system-colour outline.
 * Pass all indicator styling into `compose`, then apply its class directly. Recomposition
 * through `css(...)` cannot carry the final class's scoped preference rules.
 *
 * @example
 * An independently painted child, activated by its host's native focus-visible condition.
 * ```ts
 * import { FocusStyle } from '@sys/ui-components/style/focus';
 * import { css } from '@sys/ui-css';
 *
 * const child = FocusStyle.compose({
 *   via: '--example-focus',
 *   base: { position: 'absolute', inset: 0, pointerEvents: 'none' },
 *   paint: {
 *     arrival: { outlineColor: 'blue' },
 *     settled: { outline: '2px solid currentColor', outlineOffset: '2px' },
 *     forcedColors: { outline: '2px solid Highlight', outlineOffset: '2px' },
 *   },
 * });
 * const host = css({
 *   position: 'relative',
 *   ...child.activation,
 *   // Preserve activation: css(...) replaces nested blocks rather than merging them.
 *   ':focus-visible': { ...child.activation[':focus-visible'], outline: 'none' },
 * });
 * // Apply host.class to the focusable ancestor; child.class directly to its indicator.
 * // The indicator is hidden/inactive otherwise. Entry selects arrival; departure removes it.
 * // While focused, settled paint remains visible even when motion is disabled.
 * ```
 */
export { FocusStyle } from './m.FocusStyle.ts';

/**
 * @module
 * <IconSwatches>
 *
 * UI component for rendering a resizable grid of icon swatches.
 * - Wraps a known subset of `Icons` with the system's <Icon> renderer.
 * - Provides a `View` component for direct use in UIs and dev-harnesses.
 */
import { type t } from './common.ts';
import { Size } from './u.Size.ts';
import { Walk } from './u.Walk.ts';
import { IconSwatches as View } from './ui.tsx';

/**
 * <IconSwatches> namespace:
 */
export const IconSwatches: t.IconSwatchesLib = {
  View,
  Size,
  Walk,
  walk: Walk.icons,
};

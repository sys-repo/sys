/**
 * @module
 * SlugSheetStack
 *
 * Structural sheet stack render primitive.
 *
 * SlugSheetStack is a pure UI host for rendering an ordered stack
 * of SlugSheet instances.
 *
 * It owns visual composition only: layering, animation, z-order,
 * focus, and containment.
 *
 * Stack state, lifecycle, and intent resolution are managed externally
 * by SlugSheetStackController.
 *
 * SlugSheetStack renders exactly the sheets it is given,
 * in the order provided.
 */
import type { t } from './common.ts';
import { SlugSheetStack as UI } from './ui.tsx';

/** Runtime SlugSheetStack entry. */
export const SlugSheetStack: t.SlugSheetStackLib = {
  UI,
};

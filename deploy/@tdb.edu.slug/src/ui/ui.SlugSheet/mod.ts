/**
 * @module
 * SlugSheet
 *
 * Atomic sheet render primitive.
 *
 * SlugSheet is a pure UI surface for a single render context.
 * It renders named slots and owns no state, selection, playback,
 * navigation, or recursion semantics.
 *
 * Sheet-local behavior is handled by SlugSheetController.
 * Recursive stack behavior is handled by SlugSheetStackController.
 */
import type { t } from './common.ts';
import { SlugSheet as UI } from './ui.tsx';

export const SlugSheet: t.SlugSheetLib = {
  UI,
};

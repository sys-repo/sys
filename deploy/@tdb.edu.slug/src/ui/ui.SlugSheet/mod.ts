/**
 * @module
 * SlugSheet
 * Atomic sheet render primitive.
 *
 * A SlugSheet is a pure UI surface for a single sheet render context.
 * It renders named slots, but owns no state, selection, playback, or navigation.
 *
 * Sheet-local behavior (tree selection, content driving) is handled by
 * SlugSheetController.
 *
 * Recursive behavior (sheet stack push/pop, focus, lifecycle) is handled by
 * SlugSheetStackController.
 */
import type { t } from './common.ts';
import { SlugSheet as UI } from './ui.tsx';

export const SlugSheet: t.SlugSheetLib = { UI };

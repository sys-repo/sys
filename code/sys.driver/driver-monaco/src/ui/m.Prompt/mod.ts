/**
 * @module
 */
import type { t } from './common.ts';

/**
 * Constrains Monaco into a prompt-style input
 * (1..n visible lines with controlled enter and overflow behavior).
 *
 * Pure controller logic lives here;
 * React hooks are thin lifecycle adapters only.
 */
export const EditorPrompt: t.EditorPrompt.Lib = {};

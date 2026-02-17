/**
 * @module
 */
import type { t } from './common.ts';

/**
 * Monaco prompt-domain API surface.
 *
 * `EditorPrompt` groups input-orchestration primitives
 * (single-line and bounded multiline) implemented directly on Monaco.
 */
export const EditorPrompt: t.EditorPrompt.Lib = {};

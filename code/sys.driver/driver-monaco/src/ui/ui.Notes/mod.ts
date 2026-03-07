/**
 * @module
 * Monaco-backed notes UI for lightweight local-first editing.
 */
import type { t } from './common.ts';
import { MonacoNotes as UI } from './ui.tsx';

export const MonacoNotes: t.MonacoNotes.Lib = { UI };

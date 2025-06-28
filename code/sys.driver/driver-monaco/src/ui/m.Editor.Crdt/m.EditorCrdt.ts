import type { t } from './common.ts';
import { bind } from './m.EditorCrdt.bind.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export const EditorCrdt: t.EditorCrdtLib = { bind };

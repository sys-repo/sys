/**
 * @module
 * Development harness for inspecting CRDT repo state and live slug documents.
 */
import type { t } from './common.ts';
import { DevCrdt as UI } from './ui.tsx';

export const DevCrdt: t.DevCrdt.Lib = { UI };

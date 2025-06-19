/**
 * @module
 * User Interface Components.
 */
import { Crdt as Base } from '../m.Crdt.-browser/mod.ts';
import type { t } from './common.ts';

/**
 * UI Components:
 */
import { Card } from './ui.Card/mod.ts';
import { Input } from './ui.Input/mod.ts';
import { TextEditor } from './ui.TextEditor/mod.ts';

export { Card, Input, TextEditor };

/**
 * CRDT UI Library:
 */
export const Crdt: t.CrdtUiLib = {
  ...Base,
  UI: { Card, Input, TextEditor },
};

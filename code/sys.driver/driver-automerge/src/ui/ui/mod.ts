/**
 * @module
 * User Interface Components.
 */
import { Crdt as Base } from '../../m.Crdt.-browser/mod.ts';
import type { t } from './common.ts';

/**
 * Components:
 */
import { Card } from '../ui.Card/mod.ts';
import { DocumentId } from '../ui.DocumentId/mod.ts';
import { TextEditor } from '../ui.TextEditor/mod.ts';

export { Card, DocumentId, TextEditor };

/**
 * CRDT UI Library:
 */
export const Crdt: t.CrdtUiLib = {
  ...Base,
  UI: { Card, DocumentId, TextEditor },
};

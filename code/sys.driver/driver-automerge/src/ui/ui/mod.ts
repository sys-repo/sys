/**
 * @module
 * User Interface Components.
 */
import { Crdt as Base } from '../../m.Crdt.-browser/mod.ts';
import { DocumentIdInput as DocumentId } from '../ui.DocumentId/mod.ts';

import { Card } from '../ui.Card/mod.ts';
import { TextEditor } from '../ui.TextEditor/mod.ts';

import type { t } from './common.ts';

export const Input: t.CrdtInputLib = {
  DocumentId,
};

/**
 * CRDT UI Library:
 */
export const Crdt: t.CrdtUiLib = {
  ...Base,
  UI: { Card, Input, TextEditor },
};

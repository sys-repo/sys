/**
 * User Interface Components.
 * @module
 */
import { Crdt as Base } from '../-platforms/-browser/mod.ts';
import type { t } from './common.ts';

/**
 * Components:
 */
import { Card } from '../ui/ui.Card/mod.ts';
import { DocumentId } from '../ui/ui.DocumentId/mod.ts';
import { Repo } from '../ui/ui.Repo/mod.ts';
import { TextEditor } from '../ui/ui.TextEditor/mod.ts';
import { TextPanel } from '../ui/ui.TextPanel/mod.ts';

export { A } from './common.ts';
export { Card, DocumentId, Repo, TextEditor, TextPanel };

/**
 * Hooks:
 */
import { useRedrawEffect } from './use.RedrawEffect.ts';

/**
 * CRDT UI Library:
 */
export const Crdt: t.CrdtUiLib = {
  ...Base,
  UI: {
    Card,
    DocumentId,
    Repo,
    TextEditor,
    TextPanel,
    useRedrawEffect,
  },
};

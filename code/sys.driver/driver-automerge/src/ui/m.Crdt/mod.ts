/**
 * @module
 * User Interface Components.
 */
import { Crdt as Base } from '../../m.Crdt.platforms/-browser/mod.ts';
import type { t } from './common.ts';

/**
 * Components:
 */
import { Card } from '../ui.Card/mod.ts';
import { DocumentId } from '../ui.DocumentId/mod.ts';
import { Repo } from '../ui.Repo/mod.ts';
import { TextEditor } from '../ui.TextEditor/mod.ts';
import { TextPanel } from '../ui.TextPanel/mod.ts';

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

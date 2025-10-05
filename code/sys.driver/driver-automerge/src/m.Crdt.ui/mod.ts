/**
 * @module
 * User Interface Components.
 */
import { Crdt as Base } from '../-platforms/-web/mod.ts';
import type { t } from './common.ts';

/**
 * Components:
 */
import { BinaryFile } from '../ui/ui.BinaryFile/mod.ts';
import { Card } from '../ui/ui.Card/mod.ts';
import { DocumentId } from '../ui/ui.DocumentId/mod.ts';
import { Repo } from '../ui/ui.Repo/mod.ts';

export { A } from './common.ts';
export { BinaryFile, Card, DocumentId, Repo };

/**
 * Hooks:
 */
import { useDoc, useRev } from '../ui/use/mod.ts';
export { useDoc, useRev };

/**
 * CRDT UI Library:
 */
export const Crdt: t.CrdtUiLib = {
  ...Base,
  UI: {
    Repo,
    Card,
    DocumentId,
    BinaryFile,
    useDoc,
    useRev,
  },
};

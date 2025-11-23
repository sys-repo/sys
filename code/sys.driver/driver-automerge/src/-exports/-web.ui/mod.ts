/**
 * @module
 * User Interface Components.
 */
import { Crdt as Base } from '@sys/driver-automerge/web';
import type { t } from './common.ts';

/**
 * Components:
 */
import { Dev } from '../../ui/-dev/mod.ts';
import { Binary } from '../../ui/ui.Binary/mod.ts';
import { Card } from '../../ui/ui.Card/mod.ts';
import { Document } from '../../ui/ui.Document/mod.ts';
import { DocumentId } from '../../ui/ui.DocumentId/mod.ts';
import { Layout } from '../../ui/ui.Layout/mod.ts';
import { Repo } from '../../ui/ui.Repo/mod.ts';

export { A } from './common.ts';
export { Binary, Card, Dev, DocumentId, Layout, Repo };

/**
 * Hooks:
 */
import { useDoc, useDocStats, useRev } from '../../ui/use/mod.ts';
export { useDoc, useDocStats, useRev };

/**
 * CRDT UI Library:
 */
export const Crdt: t.CrdtViewLib = {
  ...Base,
  UI: {
    Dev,
    Repo,
    Document,
    DocumentId,
    Layout,
    Binary,
    useDoc,
    useRev,
    useDocStats,
  },
};

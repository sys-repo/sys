import type { t } from './common.ts';

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtViewLib = t.CrdtBrowserLib & {
  readonly UI: {
    // Components:
    readonly Repo: t.RepoLib;
    readonly DocumentId: t.DocumentIdLib;
    readonly Binary: t.BinaryLib;
    readonly Layout: t.LayoutLib;

    // Hooks:
    readonly useDoc: t.UseCrdtDoc;
    readonly useRev: t.UseCrdtRev;
  };
};

import type { t } from './common.ts';

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtViewLib = t.CrdtWebLib & {
  readonly UI: {
    // Components:
    readonly Dev: t.DevLib;
    readonly Repo: t.RepoInfoLib;
    readonly Document: t.DocumentLib;
    readonly DocumentId: t.DocumentIdLib;
    readonly Binary: t.BinaryLib;
    readonly Layout: t.LayoutLib;

    // Hooks:
    readonly useDoc: t.UseCrdtDoc;
    readonly useRev: t.UseCrdtRev;
  };
};

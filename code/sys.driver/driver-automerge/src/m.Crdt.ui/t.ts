import type { t } from './common.ts';

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtUiLib = t.CrdtBrowserLib & {
  readonly UI: {
    readonly Repo: t.RepoLib;
    readonly Card: React.FC<t.CardProps>;
    readonly DocumentId: t.DocumentIdLib;
    readonly BinaryFile: React.FC<t.BinaryFileProps>;

    readonly useDoc: t.UseCrdtDoc;
    readonly useRev: t.UseCrdtRev;
  };
};

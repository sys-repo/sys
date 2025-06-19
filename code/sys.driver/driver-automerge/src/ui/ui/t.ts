import type { t } from './common.ts';

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtUiLib = t.CrdtBrowserLib & {
  readonly UI: {
    readonly Card: React.FC<t.CardProps>;
    readonly DocumentId: t.DocumentIdLib;
    readonly TextEditor: React.FC<t.TextEditorProps>;
  };
};

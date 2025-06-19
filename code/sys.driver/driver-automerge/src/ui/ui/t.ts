import type { t } from './common.ts';

/**
 * Library of input UI tools.
 */
export type CrdtInputLib = {
  readonly DocumentId: t.DocumentIdInputLib;
};

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtUiLib = t.CrdtBrowserLib & {
  readonly UI: {
    Card: React.FC<t.CardProps>;
    Input: t.CrdtInputLib;
    TextEditor: React.FC<t.TextEditorProps>;
  };
};

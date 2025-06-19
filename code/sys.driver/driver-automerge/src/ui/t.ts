import { type t } from './common.ts';

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

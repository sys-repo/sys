import type { t } from './common.ts';

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtUiLib = t.CrdtBrowserLib & {
  readonly UI: {
    readonly Card: React.FC<t.CardProps>;
    readonly DocumentId: t.DocumentIdLib;
    readonly Repo: t.RepoLib;
    readonly TextEditor: React.FC<t.TextEditorProps>;

    readonly useRedrawEffect: UseRedrawEffect;
  };
};

/**
 * Hook:
 */
export type UseRedrawEffect = (
  doc?: t.CrdtRef,
  onRedraw?: (doc: t.CrdtRef) => void,
) => CrdtRedrawHook;
export type CrdtRedrawHook = { readonly doc?: t.CrdtRef };

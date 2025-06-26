import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtUiLib = t.CrdtBrowserLib & {
  readonly UI: {
    readonly Card: React.FC<t.CardProps>;
    readonly DocumentId: t.DocumentIdLib;
    readonly Repo: t.RepoLib;
    readonly TextEditor: React.FC<t.TextEditorProps>;
    readonly TextPanel: React.FC<t.TextPanelProps>;
    readonly useRedrawEffect: UseRedrawEffect;
  };
};

/**
 * Hook:
 */
export type UseRedrawEffect = <T extends O = O>(
  doc?: t.CrdtRef<T>,
  onRedraw?: (e: CrdtRedrawEvent<T>) => void,
) => CrdtRedrawHook;

export type CrdtRedrawEvent<T extends O> = {
  readonly doc: t.CrdtRef<T>;
  readonly change: t.CrdtChange<T>;
};

export type CrdtRedrawHook = {
  readonly count: number;
  readonly doc?: t.CrdtRef;
};

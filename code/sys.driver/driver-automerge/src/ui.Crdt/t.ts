import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Browser CRDT tools with UI components attached.
 */
export type CrdtUiLib = t.CrdtBrowserLib & {
  readonly UI: {
    readonly Repo: t.RepoLib;
    readonly Card: React.FC<t.CardProps>;
    readonly DocumentId: t.DocumentIdLib;
    readonly BinaryFile: React.FC<t.BinaryFileProps>;
    readonly useRedrawEffect: UseRedrawEffect;
  };
};

/**
 * Hook:
 */

/** Hook that causes a redraw on doc changes. */
export type UseRedrawEffect = <T extends O = O>(
  doc?: t.CrdtRef<T>,
  options?:
    | t.UseRedrawEffectOptions<T>
    | t.CrdtRedrawEventHandler<T>
    | (t.ObjectPath | t.ObjectPath[]),
) => CrdtRedrawHook;

export type UseRedrawEffectOptions<T extends O> = {
  onRedraw?: t.CrdtRedrawEventHandler<T>;
  path?: t.ObjectPath | t.ObjectPath[];
};

/** Callback for when a redraw is triggered. */
export type CrdtRedrawEventHandler<T extends O> = (e: CrdtRedrawEvent<T>) => void;
/** Event fired when the redraw hook redraws. */
export type CrdtRedrawEvent<T extends O> = {
  readonly doc: t.CrdtRef<T>;
  readonly change: t.CrdtChange<T>;
};

/** Redraw hook instance. */
export type CrdtRedrawHook = {
  readonly count: number;
  readonly doc?: t.CrdtRef;
};

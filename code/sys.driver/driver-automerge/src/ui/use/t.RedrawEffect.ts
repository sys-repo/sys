import type { t } from './common.ts';

type O = Record<string, unknown>;

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

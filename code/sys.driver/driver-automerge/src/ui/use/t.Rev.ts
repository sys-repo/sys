import type { t } from './common.ts';

type O = Record<string, unknown>;

/** Hook that causes a redraw on doc changes. */
export type UseCrdtRev = <T extends O = O>(
  doc?: t.CrdtRef<T>,
  options?: t.UseCrdtRevOptions<T> | t.CrdtRevChangeHandler<T> | (t.ObjectPath | t.ObjectPath[]),
) => CrdtRev;

export type UseCrdtRevOptions<T extends O> = {
  path?: t.ObjectPath | t.ObjectPath[];
  onRedraw?: t.CrdtRevChangeHandler<T>;
  onError?: (err: unknown) => void;
};

/** Callback for when a redraw is triggered. */
export type CrdtRevChangeHandler<T extends O> = (e: CrdtRedrawEvent<T>) => void;
/** Event fired when the redraw hook redraws. */
export type CrdtRedrawEvent<T extends O> = {
  readonly rev: number;
  readonly doc: t.CrdtRef<T>;
  readonly change: t.CrdtChange<T>;
};

/** Redraw hook instance. */
export type CrdtRev = {
  readonly rev: number;
  readonly doc?: t.CrdtRef;
};

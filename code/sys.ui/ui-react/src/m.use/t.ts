import type { t } from './common.ts';

export type * from './t.use.Click.ts';
export type * from './t.use.Dist.ts';
export type * from './t.use.Is.ts';
export type * from './t.use.Loading.ts';
export type * from './t.use.Pointer.Drag.ts';
export type * from './t.use.Pointer.DragDrop.ts';
export type * from './t.use.Pointer.ts';
export type * from './t.use.SizeObserver.ts';
export type * from './t.use.VisibilityThreshold.ts';

/**
 * Hook: provide simple counter incrementing component "redraw" API.
 */
export type UseRedraw = (redraw$?: t.Observable<any>) => () => void;

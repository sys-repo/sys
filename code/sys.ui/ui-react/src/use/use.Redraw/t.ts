import type { t } from '../common.ts';

/**
 * Hook: provide simple counter incrementing component "redraw" API.
 */
export type UseRedraw = (redraw$?: t.Observable<any>) => () => void;

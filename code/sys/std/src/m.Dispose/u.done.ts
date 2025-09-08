import { type t } from './common.ts';

/**
 * "Completes" a subject by running:
 *    1. subject.next();
 *    2. subject.complete();
 */
export function done(dispose$?: t.Subject<t.DisposeEvent>, reason?: unknown) {
  if (!dispose$) return;
  dispose$.next({ reason });
  dispose$.complete();
}

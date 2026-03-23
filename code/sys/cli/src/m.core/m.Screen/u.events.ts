import { type t, Rx } from '../common.ts';
import { size } from './u.size.ts';

export function events(until?: t.UntilInput): t.CliScreenEvents {
  const life = Rx.abortable(until);
  let before = size();

  const $$ = Rx.subject<t.CliScreenEvent>();
  const handler = () => {
    const after = size();
    $$.next({ kind: 'size:changed', before, after });
    before = { ...after };
  };

  // Attach and clear event handlers.
  Deno.addSignalListener('SIGWINCH', handler);
  life.dispose$.subscribe(() => Deno.removeSignalListener('SIGWINCH', handler));

  /**
   * API:
   */
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));
  return Rx.toLifecycle<t.CliScreenEvents>(life, {
    $,
    resize$: $.pipe(Rx.filter((e) => e.kind === 'size:changed')),
  });
}

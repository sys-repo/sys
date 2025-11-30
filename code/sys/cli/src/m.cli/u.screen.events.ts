import { type t, Rx } from './common.ts';
import { size } from './u.screen.size.ts';

export function events(until?: t.UntilInput): t.CliScreenEvents {
  const life = Rx.abortable(until);
  let before = size();

  const $ = Rx.subject<t.CliScreenSizeEvent>();
  const handler = () => {
    const after = size();
    $.next({ kind: 'size:changed', before, after });
    before = { ...after };
  };

  // Attach and clear event handlers.
  Deno.addSignalListener('SIGWINCH', handler);
  life.dispose$.subscribe(() => Deno.removeSignalListener('SIGWINCH', handler));

  /**
   * API:
   */
  return Rx.toLifecycle<t.CliScreenEvents>(life, {
    $: $.pipe(Rx.takeUntil(life.dispose$)),
  });
}

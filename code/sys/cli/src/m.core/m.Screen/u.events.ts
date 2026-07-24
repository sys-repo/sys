import { type t, Rx } from '../common.ts';
import { ScreenPlatform } from './u.platform.ts';
import { size } from './u.size.ts';

type Deps = {
  readSize: t.CliScreenLib['size'];
  observeResize: (handler: () => void) => () => void;
};

/** Create terminal screen events over injected measurement and observation dependencies. */
export function createEvents(deps: Deps, until?: t.UntilInput): t.CliScreenEvents {
  const life = Rx.abortable(until);
  let before = deps.readSize();

  const $$ = Rx.subject<t.CliScreenEvent>();
  const handler = () => {
    const after = deps.readSize();
    $$.next({ kind: 'size:changed', before, after });
    before = { ...after };
  };

  const stop = deps.observeResize(handler);
  life.dispose$.subscribe(() => stop());

  /**
   * API:
   */
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));
  return Rx.toLifecycle<t.CliScreenEvents>(life, {
    $,
    resize$: $.pipe(Rx.filter((e) => e.kind === 'size:changed')),
  });
}

export function events(until?: t.UntilInput): t.CliScreenEvents {
  return createEvents({
    readSize: size,
    observeResize: ScreenPlatform.observeResize,
  }, until);
}

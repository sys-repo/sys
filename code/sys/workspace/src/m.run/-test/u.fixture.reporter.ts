import { Rx, type t } from '../../-test.ts';
import type { ParallelReporterRuntimeDeps } from '../u/u.reporter.runtime.ts';

export function createReporterScreen(
  initial: t.Cli.Screen.Size = { width: 100, height: 30 },
) {
  const life = Rx.lifecycle();
  const subject = Rx.subject<t.Cli.Screen.Event>();
  const $ = subject.asObservable();
  const resize$ = $.pipe(Rx.filter((event) => event.kind === 'size:changed'));
  const events = Rx.toLifecycle<t.Cli.Screen.Events>(life, { $, resize$ });
  let before = { ...initial };

  return {
    events,
    resize(after: t.Cli.Screen.Size) {
      const accepted = { ...after };
      subject.next({ kind: 'size:changed', before, after: accepted });
      before = accepted;
    },
  };
}

export function createInertReporterRuntimeDeps(
  spinner: t.Cli.Spinner.Instance,
): ParallelReporterRuntimeDeps {
  const viewport = { width: 100, height: 24 };
  const screen = createReporterScreen(viewport);
  const inert = (): t.Cancellable => ({ cancel() {} });

  return {
    cursorRows: 1,
    size: () => ({ ...viewport }),
    events: () => screen.events,
    spinner: () => spinner,
    repaint: () => {},
    schedule: inert,
    tick: inert,
  };
}

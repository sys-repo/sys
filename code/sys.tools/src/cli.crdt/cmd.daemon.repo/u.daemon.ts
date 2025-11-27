import { type t, c, Cli, D, Rx, Time, Str } from '../common.ts';
import { startRepoOnWorker } from '../worker/mod.ts';
import { Fmt } from './u.fmt.ts';
import { tryClient } from './u.client.ts';
import { getConfig } from '../u.config.ts';

/**
 * Runs the CRDT repo as a long-lived daemon rendering a live terminal UI.
 */
export async function daemon(dir: t.StringDir) {
  const port = D.port.repo;
  const cmd = await tryClient(port);
  if (cmd) {
    const str = Str.builder()
      .line()
      .line(c.yellow(`  Cannot start daemon — already running on port ${c.white(String(port))}`))
      .line(c.italic(c.gray(`  Use the existing service.`)))
      .line();
    console.info(String(str));
    return;
  }

  const config = await getConfig(dir);
  const websockets = config.current.repo?.daemon?.sync?.websockets ?? [];
  const eventlog = new Set<t.CrdtRepoLogEntry>();

  let hasStarted = false;
  const getStatus = () => {
    const status = repo.status;
    const alive = status.ready && !status.stalled;
    if (alive) hasStarted = true;
    const stalled = hasStarted && !alive;
    return { alive, stalled };
  };

  console.log('websockets', websockets);

  /**
   * Prepare CRDT repository on background worker.
   */
  console.clear();
  const spinner = Cli.spinner(Fmt.spinnerText('starting repository...'));
  const repo = await startRepoOnWorker(dir, { port, websockets });
  const events = repo.events();
  spinner.stop();

  /**
   * Print screen:
   */
  const print = () => {
    const { alive, stalled } = getStatus();
    const screen = Fmt.Repo.screen({ repo, port, alive, events: [...eventlog] });
    console.clear();
    if (!alive || stalled) {
      const msg = stalled ? `momentarily busy...` : `initial document reconciliation....`;
      spinner.start(Fmt.spinnerText(msg) + screen);
    } else {
      const msg = c.dim(c.gray('(Ctrl-C to exit)'));
      spinner.stop();
      console.info(msg + screen);
    }
  };
  print();

  /**
   * Monitor:
   */
  events.$.pipe(Rx.debounceTime(120)).subscribe((ev) => {
    eventlog.add({ at: Time.now.timestamp, ev });
    print();
  });

  // 1. Wait here until Ctrl-C.
  await Cli.keepAlive();

  // 2. Then shut down, fully awaited.
  spinner.start(Fmt.spinnerText('shutting down...'));
  await repo.dispose();
  spinner.stop();
}

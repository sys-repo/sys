import { type t, Fs, c, Cli, D, Rx, Time, Str } from '../common.ts';
import { startRepoOnWorker } from '../worker/mod.ts';
import { Fmt } from './u.fmt.ts';
import { tryClient } from './u.client.ts';
import { getConfig } from '../u.config.ts';

/**
 * Runs the CRDT repo as a long-lived daemon rendering a live terminal UI.
 */
export async function daemon(cwd: t.StringDir) {
  const config = await getConfig(cwd);
  const port = D.port.repo;
  const eventlog = new Set<t.CrdtRepoLogEntry>();
  const websockets = config.current.repo?.daemon?.sync?.websockets ?? [];

  if (websockets.length === 0) {
    const str = Str.builder();
    str
      .line()
      .line(c.yellow(`  Please make sure at least one network endpoint (websockets) is configured`))
      .line(c.gray(`  ${c.italic('Look in the config file:')} ${Fs.trimCwd(config.fs.path)}`))
      .line();
    console.info(String(str));
    return;
  }

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

  let hasStarted = false;
  const getStatus = () => {
    const status = repo.status;
    const alive = status.ready && !status.stalled;
    if (alive) hasStarted = true;
    const stalled = hasStarted && !alive;
    return { alive, stalled };
  };

  /**
   * Prepare CRDT repository on background worker.
   */
  console.clear();
  const spinner = Cli.spinner(Fmt.spinnerText('starting repository...'));
  const repo = await startRepoOnWorker(cwd, { port, websockets });
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

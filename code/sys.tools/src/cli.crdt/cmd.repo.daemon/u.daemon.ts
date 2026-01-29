import { type t, c, Cli, Err, Fs, Rx, Str, Time } from '../common.ts';
import { CrdtReposFs } from '../u.repos/u.fs.ts';
import { startRepoOnWorker } from '../u.worker/mod.ts';
import { tryClient } from './u.client.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Runs the CRDT repo as a long-lived daemon rendering a live terminal UI.
 */
export async function daemon(
  cwd: t.StringDir,
  opts: { until?: t.UntilInput; allowConsoleClear?: boolean } = {},
) {
  const { allowConsoleClear = true } = opts;
  const life = Rx.lifecycle(opts.until);
  const ports = await CrdtReposFs.loadPorts(cwd);
  const port = ports.repo;
  const eventlog = new Set<t.CrdtRepoLogEntry>();
  const websockets = await CrdtReposFs.loadSync(cwd);

  const clear = () => {
    if (allowConsoleClear) console.clear();
  };

  if (websockets.length === 0) {
    const str = Str.builder();
    str
      .line()
      .line(c.yellow(`  Please make sure at least one network endpoint is configured (websockets)`))
      .line(
        c.gray(
          `  ${c.italic('Look in the config file:')} ${Fs.trimCwd(Fs.join(cwd, CrdtReposFs.file()))}`,
        ),
      )
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
  clear();
  const spinner = Cli.spinner(Fmt.spinnerText('starting repository...'));

  /**
   * Start the CRDT repository worker with simple retry semantics.
   * Any startup error is logged cleanly, then the daemon waits and tries again.
   */
  async function startRepoWithRetry() {
    // Initial attempt uses the already-running spinner.
    for (;;) {
      try {
        return await startRepoOnWorker(cwd, { port, websockets });
      } catch (err) {
        eventlog.add({
          at: Time.now.timestamp,
          event: { kind: 'daemon:error', message: Err.summary(err), detail: err },
        });
        spinner.stop();

        const str = Str.builder();
        str
          .line()
          .line(c.red(`  Failed to start CRDT repository daemon.`))
          .line(c.gray(`  ${c.italic(Err.summary(err))}`))
          .line()
          .line(c.gray(`  Retrying shortly... (Ctrl-C to exit)`))
          .line();
        console.info(String(str));

        // Brief pause before next attempt.
        await Time.wait(1500);
        spinner.start(Fmt.spinnerText('starting repository...') + screen);
      }
    }
  }

  const repo = await startRepoWithRetry();
  eventlog.add({
    at: Time.now.timestamp,
    event: { kind: 'daemon:info', message: `daemon started on port ${String(port)}` },
  });
  spinner.stop();

  /**
   * Print screen:
   */
  let _rev = 0;
  const print = () => {
    _rev++;
    const { alive, stalled } = getStatus();
    const screen = Fmt.Repo.screen({ repo, port, alive, events: [...eventlog] });
    clear();
    if (!alive || stalled) {
      const msg = stalled ? `momentarily busy...` : `initial document reconciliation....`;
      spinner.start(Fmt.spinnerText(msg) + screen);
    } else {
      const msg = c.dim(c.gray(`(Ctrl-C to exit)`));
      spinner.stop();
      console.info(msg + screen);
    }
  };
  print();

  /**
   * Monitor:
   */
  Cli.Screen.events(life).resize$.subscribe(print);
  repo
    .events(life)
    .$.pipe(Rx.debounceTime(120))
    .subscribe((payload) => {
      const at = Time.now.timestamp;
      eventlog.add({ at, event: { kind: 'wire', payload } });
      print();
    });

  // 1. Wait here until Ctrl-C.
  await Cli.keepAlive({ life });

  // 2. Then shut down, fully awaited.
  spinner.start(Fmt.spinnerText('shutting down...'));
  eventlog.add({
    at: Time.now.timestamp,
    event: { kind: 'daemon:info', message: 'daemon shutting down' },
  });
  await repo.dispose();
  spinner.stop();
}

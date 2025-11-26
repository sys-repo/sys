import { type t, c, Cli, Rx, Time } from '../common.ts';
import { startRepoOnWorker } from '../worker/mod.ts';
import { Fmt } from './u.fmt.ts';

export const RepoDaemon = {
  async start(dir: t.StringDir) {
    const eventlog = new Set<t.CrdtRepoLogEntry>();
    const port = 49494;

    let hasBecomeAlive = false;
    const getStatus = () => {
      const status = repo.status;
      const alive = status.ready && !status.stalled;
      if (alive) hasBecomeAlive = true;
      const stalled = hasBecomeAlive && !alive;
      return { alive, stalled };
    };

    /**
     * Prepare CRDT repository on background worker.
     */
    console.clear();
    const spinner = Cli.spinner(Fmt.spinnerText('starting repository...'));
    const repo = await startRepoOnWorker(dir, { port });
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
        const msg = stalled ? `momentarily stalled...` : `sync reconciliation....`;
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
  },
} as const;

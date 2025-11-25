import { type t, Cli, keepAlive, Rx, Time } from '../common.ts';
import { startRepoOnWorker } from '../worker/mod.ts';
import { Fmt } from './u.fmt.ts';

export const RepoDaemon = {
  async start(dir: t.StringDir) {
    const eventlog = new Set<t.CrdtRepoLogEntry>();
    const port = 49494;

    /**
     * Prepare CRDT repository on background worker.
     */
    console.clear();
    const spinner = Cli.spinner(Fmt.spinnerText('starting repository...'));
    const repo = await startRepoOnWorker(dir);
    const events = repo.events();
    spinner.stop();

    /**
     * Print screen:
     */
    const print = () => {
      const alive = repo.status.ready && !repo.status.stalled;
      const screen = Fmt.Repo.screen({ repo, port, alive, events: [...eventlog] });
      console.clear();
      if (!alive) {
        const msg = Fmt.spinnerText(`momentarily stalled...`);
        spinner.start(msg + screen);
      } else {
        spinner.stop();
        console.info(screen);
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
    await keepAlive();

    // 2. Then shut down, fully awaited.
    spinner.start(Fmt.spinnerText('shutting down...'));
    await repo.dispose();
    spinner.stop();
  },
} as const;

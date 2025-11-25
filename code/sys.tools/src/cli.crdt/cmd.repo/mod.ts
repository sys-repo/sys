/**
 * @module
 * Daemon for CRDT repos.
 *
 * Runs a long-lived local process that hosts a CRDT repo and exposes a
 * typed Cmd control plane over WebSocket, bridging browser clients,
 * local filesystem persistence, and upstream sync servers.
 */
import { type t, Cli, c, keepAlive } from '../common.ts';
import { startRepoOnWorker } from '../worker/mod.ts';
import { Fmt } from '../u.fmt.ts';

export const RepoDaemon = {
  async start(dir: t.StringDir) {
    console.clear();

    /**
     * Prepare CRDT repository on background worker.
     */
    const spinner = Cli.spinner(Fmt.spinnerText('starting repository...'));
    const repo = await startRepoOnWorker(dir);
    spinner.stop();

    /**
     * Print.
     */
    console.clear();
    console.info();
    console.info('🐷 repo', repo);
    console.info();
    console.info(c.gray(`(Ctrl-C to exit)`));

    await keepAlive(async ({ life }) => {
      life.dispose$.subscribe({
        complete: async () => {
          spinner.start(Fmt.spinnerText('shutting down...'));
          await repo.dispose();
          spinner.stop();
        },
      });
    });
  },
} as const;

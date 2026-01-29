import { Server } from '@sys/driver-automerge/ws';
import { type t, Cli, D, Path } from '../common.ts';
import { CrdtReposFs } from '../u.repos/u.fs.ts';
import { Fmt } from '../u.fmt.ts';

export async function startSyncServerCommand(cwd: t.StringDir, port?: number) {
  if (port == null) {
    const ports = await CrdtReposFs.loadPorts(cwd);
    port = ports.sync;
  }

  async function run(life: t.Lifecycle) {
    const server = await Server.ws({ port, dir: Path.join(cwd, D.Path.Repo.syncserver) });

    const shutdown = async () => {
      const spinner = Cli.spinner();
      spinner.start(Fmt.spinnerText('shutting down...'));
      await server.dispose();
      spinner.stop();
    };

    life.dispose$.subscribe({ complete: shutdown });
  }

  // Wait here until (Ctrl-C).
  await Cli.keepAlive({
    onStart: async (life) => await run(life),
    exitCode: 0,
  });
}

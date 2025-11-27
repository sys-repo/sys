import { Server } from '@sys/driver-automerge/ws';
import { type t, Cli, D, Path } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

export async function startSyncServer(dir: t.StringDir, port?: number) {
  port = port ?? D.port.sync;

  async function run(life: t.Lifecycle) {
    const server = await Server.ws({ port, dir: Path.join(dir, D.Path.Repo.syncserver) });

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

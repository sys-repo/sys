import { Server } from '@sys/driver-automerge/ws';
import { type t, Cli, D } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

export async function startSyncServer(dir: t.StringDir, port?: number) {
  port = port ?? D.port.sync;

  // Wait here until Ctrl-C.
  await Cli.keepAlive({
    async onStart(life) {
      const server = await Server.ws({ port, dir });

      life.dispose$.subscribe({
        async complete() {
          const spinner = Cli.spinner();
          spinner.start(Fmt.spinnerText('shutting down...'));
          await server.dispose();
          spinner.stop();
        },
      });
    },
    exitCode: 0,
  });
}

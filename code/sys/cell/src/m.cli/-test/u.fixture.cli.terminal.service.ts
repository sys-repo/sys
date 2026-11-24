// Copied into an isolated Cell: package imports deliberately survive fixture relocation.
import type { Cell } from '@sys/cell/t';
import { Fs } from '@sys/fs';
import { Env } from '@sys/fs/env';
import { HttpServer } from '@sys/http/server';
import { Time } from '@sys/std/time';

/** File-controlled service: no signals or production timing changes manufacture its outcome. */
export const TerminalService = {
  async start(args: Cell.Services.StartArgs) {
    const env = await Env.load({ cwd: args.cwd });
    const control = env.get('CELL_PTY_CONTROL');
    const mode = env.get('CELL_PTY_MODE');
    if (!control) throw new Error('Missing CELL_PTY_CONTROL.');

    const app = HttpServer.create({ cors: false, static: false });
    app.get('/', (ctx) => ctx.text('terminal-proof'));
    const server = HttpServer.start(app, {
      hostname: '127.0.0.1',
      port: 0,
      strictPort: true,
      keyboard: false,
      silent: true,
    });
    const close = async () => {
      await server.close();
      await Fs.write(Fs.join(control, 'closed'), 'closed');
    };
    try {
      await Fs.write(Fs.join(control, 'port'), String(server.port));
      await wait('start');
      if (mode === 'startup-failure') throw new Error('pty-startup-failure');
    } catch (error) {
      await close();
      throw error;
    }
    return {
      finished: wait('finish'),
      async close() {
        await close();
        if (mode === 'cleanup-failure') throw new Error('pty-cleanup-failure');
      },
      status: () => ({ state: 'ready' }),
    };

    async function wait(name: string) {
      await Time.waitFor(() => Fs.exists(Fs.join(control, name)), {
        interval: 20,
        timeout: 15_000,
      });
    }
  },
};

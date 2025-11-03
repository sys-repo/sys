import { type t, Args, c, Cli, Crdt, D, Fs, Rx, Time } from './common.ts';
import { run } from './u.cli.run.ts';
import { Fmt } from './u.fmt.ts';
import { keepAlive } from './u.keepAlive.ts';

export const cli: t.CrdtToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  // Start repo:
  const ws = D.Sync.server;
  const repo = await Crdt.repo({ network: [{ ws }] }).whenReady();
  const shutdown = async () => {
    await Time.wait(0);
    await repo.dispose();
  };

  // Pause as this will block/freeze while it gets the repo into memory.
  console.info();
  const spinner = Cli.spinner(c.gray('initializing...'));
  await Time.wait(5_000);
  spinner.stop();

  // Simple immediate exit on Ctrl-C.
  Deno.addSignalListener('SIGINT', async () => {
    await shutdown();
    Deno.exit(0);
  });

  // Loops on main seleection list:
  await keepAlive(async (until) => {
    const life = Rx.lifecycle(until);

    try {
      while (!life.disposed) {
        console.info(await Fmt.header(toolname));
        const res = await run(dir, repo);
        if (res.exit) {
          life.dispose('exit'); // signal termination
          shutdown();
          break;
        }
      }
    } finally {
    }
  });

  // Shutdown:
  console.info(Fmt.signoff(toolname));
  await shutdown();
};

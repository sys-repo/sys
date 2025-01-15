import { type t, Cli } from './common.ts';

export const Main: t.HttpMainLib = {
  async entry(argv) {
    const args = Cli.args<t.HttpMainArgs>(argv ?? Deno.args);
    if (args.cmd === 'start') return Main.start(args);
  },

  async start(args) {
    if (args.cmd !== 'start') return;
    const { port = 8080 } = args;

  },
};

import { type t, VitepressLog, Net, Process, stripAnsi } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';

type F = t.VitepressLib['dev'];
type R = t.VitepressDevServer;

/**
 * Matches (example):
 *   vitepress v1.5.0
 */
const vitepressStartupRegex = /vitepress v\d\.\d\.\d/g;

/**
 * https://vitepress.dev/reference/cli#vitepress-dev
 */
export const dev: F = async (input = {}) => {
  const options = wrangle.options(input);
  const { pkg, inDir = '', open = false } = options;
  const dirs: R['dirs'] = { in: inDir };
  const port = Net.port(options.port ?? 1234);

  let params = `--port=${port} --host`;
  if (open) params += ` --open`;
  const cmd = `deno run -A --node-modules-dir npm:vitepress dev ${inDir} ${params}`;
  const args = cmd.split(' ').slice(1);
  const url = `http://localhost:${port}`;

  VitepressLog.Dev.log({ inDir, pkg });

  const readySignal: t.ProcReadySignalFilter = (e) => {
    const lines = stripAnsi(e.toString()).split('\n');
    return lines.some((line) => !!vitepressStartupRegex.exec(line));
  };

  const proc = Process.spawn({ args, readySignal, silent: false, dispose$: options.dispose$ });
  const dispose = proc.dispose;
  const keyboard = keyboardFactory({ port, url, pkg, dispose });

  const listen = async () => {
    await keyboard();
  };

  await proc.whenReady();
  const api: R = {
    port,
    url,
    listen,
    keyboard,

    get proc() {
      return proc;
    },

    get dirs() {
      return dirs;
    },

    /**
     * Lifecycle.
     */
    dispose,
    get dispose$() {
      return proc.dispose$;
    },
    get disposed() {
      return proc.disposed;
    },
  };
  return api;
};

/**
 * Helpers
 */
const wrangle = {
  options(input: Parameters<F>[0]): t.VitepressDevArgs {
    if (typeof input === 'string') return { inDir: input };
    return input ?? {};
  },
} as const;

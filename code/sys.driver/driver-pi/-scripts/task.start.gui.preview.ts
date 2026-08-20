import { Fs, Process } from './task.start.gui.preview.common.ts';
import { resolvePreviewDenoDir } from './task.start.gui.preview.deno.ts';

const packageRoot = Fs.resolve(import.meta.dirname ?? '.', '..');
const worker = Fs.Path.fromFileUrl(
  new URL('./task.start.gui.preview.worker.ts', import.meta.url),
);
const denoDir = await resolvePreviewDenoDir(packageRoot);
const systemRoot = Deno.build.os === 'windows' ? Deno.env.get('SystemRoot') : undefined;
const executableSearchPath = Deno.build.os === 'windows'
  ? [
    Fs.Path.dirname(Deno.execPath()),
    ...(systemRoot ? [Fs.Path.join(systemRoot, 'System32'), systemRoot] : []),
  ].join(';')
  : [Fs.Path.dirname(Deno.execPath()), '/usr/bin', '/bin'].join(':');
const result = await Process.inherit({
  cmd: Deno.execPath(),
  args: [
    'run',
    '--quiet',
    '--frozen',
    '--no-prompt',
    '-P=preview-worker',
    '--deny-write=../../..',
    worker,
    ...Deno.args,
  ],
  cwd: packageRoot,
  clearEnv: true,
  env: {
    DENO_DIR: denoDir,
    FORCE_COLOR: '1',
    PATH: executableSearchPath,
    ...(systemRoot ? { SystemRoot: systemRoot } : {}),
  },
});
if (!result.success) Deno.exit(result.code);

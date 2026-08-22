import { Fs, Process } from './common.ts';
import { resolvePreviewDenoDir } from './u.deno.ts';

const packageRoot = Fs.resolve(import.meta.dirname ?? '.', '../..');
const worker = Fs.Path.fromFileUrl(new URL('./-entry.worker.ts', import.meta.url));

/** Launch the preview runtime in a sanitized, least-authority worker process. */
export async function main(): Promise<void> {
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
}

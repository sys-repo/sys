import { Fs, Json } from './task.start.gui.preview.common.ts';
import type { PreviewBuildInput, PreviewBuildResponse } from './task.start.gui.preview.t.ts';

const [inputPath, outputPath] = Deno.args;
if (!inputPath || !outputPath) throw new Error('start:gui:preview build child input invalid.');

const packageRoot = Fs.resolve(import.meta.dirname ?? '.', '..');
const workspaceRoot = Fs.resolve(packageRoot, '../../..');
assertSanitizedEnvironment();
await assertConfinedAuthority();

const input = (await Fs.readJson<PreviewBuildInput>(inputPath)).data;
if (!input) throw new Error('start:gui:preview build child input unavailable.');

const { Vite } = await import('@sys/driver-vite');
const build = await Vite.build({ ...input, silent: true, spinner: false });
const output: PreviewBuildResponse = Object.freeze({
  ok: build.ok,
  paths: build.paths,
  manifest: build.manifest,
});
await Fs.write(outputPath, Json.stringify(output));

function assertSanitizedEnvironment(): void {
  if (Deno.env.has('SYS_DRIVER_PI_PREVIEW_AMBIENT_SENTINEL')) {
    throw new Error('start:gui:preview build child environment unsanitized.');
  }
}

async function assertConfinedAuthority(): Promise<void> {
  const forbiddenWrites = [
    Fs.join(packageRoot, 'dist'),
    Fs.join(workspaceRoot, '.pi/@sys/dist'),
    Fs.resolve(packageRoot, '../driver-vite'),
  ];
  for (const path of forbiddenWrites) {
    const status = await Deno.permissions.query({ name: 'write', path });
    if (status.state === 'granted') {
      throw new Error('start:gui:preview build child write authority overbroad.');
    }
  }

  const wildcard = await Deno.permissions.query({ name: 'net', host: '0.0.0.0' });
  const unlistedRun = await Deno.permissions.query({ name: 'run', command: 'sh' });
  if (wildcard.state === 'granted' || unlistedRun.state === 'granted') {
    throw new Error('start:gui:preview build child process authority overbroad.');
  }
}

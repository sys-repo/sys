import { Fs, Is, Json, slug } from '../../-test.ts';
import { type FixtureRun, runDeno } from './u.fixture.run.ts';

type RunProbeArgs = {
  readonly name: string;
  readonly source: string;
  readonly denoArgs: readonly string[];
};

const PACKAGE_DIR = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));

export const PROBE_JSON_PREFIX = '__SYS_VITE_PROBE__';

/** Run one attributable TypeScript child probe from the package root. */
export async function runProbe(args: RunProbeArgs): Promise<FixtureRun> {
  if (!Is.string(args.name) || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(args.name)) {
    throw new Error(`Invalid external probe name: ${String(args.name)}`);
  }

  const path = Fs.join(PACKAGE_DIR, `.tmp.${args.name}.${slug()}.ts`);
  try {
    await Fs.write(path, args.source);
    return await runDeno(PACKAGE_DIR, [...args.denoArgs, path]);
  } finally {
    await Fs.remove(path, { log: false });
  }
}

/** Extract the final prefixed JSON payload from child stdout. */
export function parseProbeJson<T>(stdout: string): T {
  const line = stdout.trim().split('\n').findLast((line) => line.startsWith(PROBE_JSON_PREFIX));
  if (!line) throw new Error(`Probe JSON marker not found in stdout:\n${stdout.trim()}`);
  return Json.parse(line.slice(PROBE_JSON_PREFIX.length)) as T;
}

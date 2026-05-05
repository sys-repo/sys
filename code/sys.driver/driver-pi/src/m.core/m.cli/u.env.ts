import { Fs, Path, type t } from './common.ts';

export const PiEnv = {
  toShellPath() {
    return (env('SHELL') || '/bin/bash') as t.StringDir;
  },

  async toTmpDir() {
    return env('TMPDIR') || env('TMP') || env('TEMP') || (await toPlatformTmpDir());
  },
} as const;

/**
 * Helpers:
 */
function env(name: string) {
  return Deno.env.get(name);
}

async function toPlatformTmpDir() {
  const probe = await Fs.makeTempDir({ prefix: 'driver-pi.cli.' });
  try {
    return Path.dirname(probe.absolute) as t.StringDir;
  } finally {
    await Fs.remove(probe.absolute);
  }
}

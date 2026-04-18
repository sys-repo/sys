import { Fs, Path, type t } from './common.ts';

export const PiEnv = {
  toHome() {
    return env('HOME');
  },

  toAgentsSkillsDir() {
    const home = PiEnv.toHome();
    return home ? Fs.join(home, '.agents', 'skills') : undefined;
  },

  toGoogleCredentialPath() {
    const home = PiEnv.toHome();
    return home
      ? Fs.join(home, '.config', 'gcloud', 'application_default_credentials.json')
      : undefined;
  },

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
  const probe = await Fs.makeTempDir({ prefix: 'driver-agent.pi.cli.' });
  try {
    return Path.dirname(probe.absolute) as t.StringDir;
  } finally {
    await Fs.remove(probe.absolute);
  }
}

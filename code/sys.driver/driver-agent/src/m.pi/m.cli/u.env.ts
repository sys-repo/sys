import { Fs, type t } from './common.ts';

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

  toTmpDir() {
    return env('TMPDIR') || env('TMP') || env('TEMP') || undefined;
  },
} as const;

/**
 * Helpers:
 */
function env(name: string) {
  return Deno.env.get(name);
}

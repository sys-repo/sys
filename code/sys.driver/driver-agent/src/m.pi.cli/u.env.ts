import { Fs, type t } from './common.ts';

export const PiEnv = {
  toHomeDir() {
    return env('HOME');
  },

  toHomeAgentsSkillsDir() {
    const home = PiEnv.toHomeDir();
    return home ? Fs.join(home, '.agents', 'skills') : undefined;
  },

  toGoogleApplicationDefaultCredentialsPath() {
    const home = PiEnv.toHomeDir();
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

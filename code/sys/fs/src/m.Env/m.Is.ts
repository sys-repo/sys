import { type t } from './common.ts';

export const Is: t.EnvIsLib = {
  get vscode() {
    return isVsCode();
  },
};

/**
 * Helpers:
 */
function isVsCode(env = Deno.env.toObject()) {
  return (
    env.TERM_PROGRAM === 'vscode' || // ← universal signal
    'VSCODE_PID' in env || //           ← secondary guard
    'VSCODE_CWD' in env //              ← extra safety
  );
}

import { c, type t } from '../common.ts';

/**
 * Lazy UI start leaf.
 *
 * Runtime composition for the local UI mode is intentionally deferred until a concrete
 * launcher-owned Dist source declaration and exact integrity pin are approved and wired.
 */
export async function start(input: {
  readonly cwd: t.PiCli.Cwd;
  readonly until?: t.UntilInput;
  readonly mode: t.PiCliProfiles.StartMode;
}): Promise<void> {
  console.log(c.yellow('🐷 start:ui is currently placeholder (NOT_IMPLEMENTED)'));
}

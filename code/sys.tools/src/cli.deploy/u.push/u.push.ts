import { type t } from '../common.ts';
import { R2Provider } from '../u.providers/mod.ts';

/** Publish a resolved deploy target through its provider adapter. */
export async function pushTarget(args: {
  cwd: t.StringDir;
  target: t.PushTarget;
  force?: boolean;
}): Promise<t.PushResult> {
  return await R2Provider.push(args);
}

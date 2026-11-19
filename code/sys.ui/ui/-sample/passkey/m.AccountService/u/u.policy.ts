import { Is, Obj, Schema, type t, Url } from './common.ts';
import { PolicySchema } from './u.policy.schema.ts';

/** Capture trusted host configuration; this is not a sandbox for hostile objects or getters. */
export function capturePolicy(
  options: t.AccountService.Options,
): t.DeepReadonly<t.AccountService.Options> {
  if (!Schema.Value.Check(PolicySchema, options)) {
    throw new TypeError('Invalid account service policy.');
  }
  const copy = {
    rp: { ...options.rp },
    origins: [...options.origins],
    algorithms: [...options.algorithms],
    lifetimes: { ...options.lifetimes },
    capacity: { ...options.capacity },
  };
  const rp = Url.parse(`https://${copy.rp.id}`);
  if (!rp.ok) throw new TypeError('Invalid account service policy.');
  if (rp.toURL().host !== copy.rp.id || copy.rp.id.endsWith('.')) {
    throw new TypeError('Invalid account service policy.');
  }
  for (const origin of copy.origins) {
    const parsed = Url.parse(origin);
    if (!parsed.ok) throw new TypeError('Invalid account service policy.');
    const url = parsed.toURL();
    const secure = url.protocol === 'https:';
    const localDevelopment = url.protocol === 'http:' && Is.localhost(origin);
    const bound = url.hostname === copy.rp.id || url.hostname.endsWith(`.${copy.rp.id}`);
    if (!secure && !localDevelopment) throw new TypeError('Invalid account service policy.');
    if (url.origin !== origin || !bound) {
      throw new TypeError('Invalid account service policy.');
    }
  }
  return Obj.deepFreeze(copy);
}

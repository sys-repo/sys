import { type t, Is } from './common.ts';

export const gateAs: t.SlugTraitsSchemaLib['gateAs'] = ({ traits, opt }) => {
  /**
   * Explicit opt-out: trait gating disabled.
   */
  if (opt === null) {
    return { ok: true, enabled: false };
  }

  /**
   * No trait option provided: no gating requested.
   * (Default behavior is decided by the caller.)
   */
  if (!opt) {
    return { ok: true, enabled: false, requested: false };
  }

  const { of, mode = 'require', forcedAs } = opt;
  const trait = traits.find((t) => t.of === of);
  const as = Is.str(trait?.as) ? trait.as : mode === 'force' ? forcedAs : undefined;

  if (!Is.str(as)) {
    const err = `Slug does not advertise required trait ` + `(expected {of:"${of}", as:string}).`;
    return { ok: false, error: new Error(err) };
  }

  return { ok: true, enabled: true, as };
};

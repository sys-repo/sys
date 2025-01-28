import { type t, Err, Fetch } from './common.ts';
import { create } from './u.create.ts';

export const fetch: t.JsrManifestLib['fetch'] = async (name, version, options = {}) => {
  const origin = Fetch.Url.origin;
  const errors = Err.errors();

  const res = await Fetch.Pkg.info(name, version, options);
  const { data, error, status } = res;

  if (error) errors.push(error);
  if (!error) {
    // Double-check for the existence of required data.
    if (!data) errors.push('Failed to retrieve response data from origin.');
    if (data && !data.manifest) errors.push('Failed to retrieve manifest details from origin.');
  }
  if (res.error || !data || !data.manifest || !errors.is.empty) {
    return {
      ok: false,
      status,
      origin,
      error: errors.toError()!,
    };
  }

  const manifest = create(data.pkg, data.manifest);
  return {
    ok: true,
    status,
    origin,
    manifest,
    error: undefined,
  };
};

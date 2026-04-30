import { c, Err, Http, Pkg, type t, Url } from '../common.ts';

export type DistUrlCheck =
  | { readonly ok: true; readonly url: t.StringUrl }
  | { readonly ok: false; readonly url: t.StringUrl; readonly error: string };

const fail = (url: t.StringUrl, error: string): DistUrlCheck => ({
  ok: false,
  url,
  error,
});

/**
 * Ensure a remote dist.json URL is reachable and valid.
 */
export async function validateDistUrl(input: t.StringUrl): Promise<DistUrlCheck> {
  // Canonicalize first (origin + pathname, no query/hash).
  const canonical = Url.toCanonical(input);
  if (!canonical.ok) {
    return fail(input, 'Invalid URL.');
  }

  const url = canonical.href;

  try {
    // Must be reachable and return valid JSON.
    const http = Http.client();
    const res = await http.json(url);

    if (!Pkg.Is.dist(res.data)) {
      return fail(url, `Does not have a valid ${c.italic(c.cyan('dist.json'))} file.`);
    }

    return { ok: true, url };
  } catch (err) {
    const reason = Err.summary(err, { cause: true, stack: false });
    return fail(url, `Failed to fetch or parse dist.json. ${reason}`);
  }
}

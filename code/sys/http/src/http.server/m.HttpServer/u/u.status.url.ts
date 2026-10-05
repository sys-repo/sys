import { Is, Str, type t } from '../common.host.ts';

/** Convert HTTP-server owner URL paths into renderer-neutral service URLs. */
export function statusUrls(
  origin: t.StringUrl,
  paths: readonly t.HttpServer.Status.UrlPath[] | undefined,
): readonly t.Service.Url[] {
  const items = paths && paths.length > 0 ? paths : ['/'] as const;
  return items.map((item) => {
    const path = Is.str(item) ? item : item.path;
    const label = Is.str(item) ? undefined : item.label;
    const href = statusHref(origin, path);
    return label ? { href, label } : { href };
  });
}

function statusHref(origin: t.StringUrl, path: string): t.StringUrl {
  const suffix = Str.trimLeadingSlashes(path);
  if (!suffix) return `${origin}/` as t.StringUrl;
  return `${origin}/${suffix}` as t.StringUrl;
}

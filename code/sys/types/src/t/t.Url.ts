/**
 * Inputs accepted by the Url immutable helpers.
 *
 * - `URL` instances.
 * - Any `{ href: string }` (e.g. Location-like).
 * - Any `{ toURL(): URL }` (e.g. HttpUrl from StdUrlLib).
 */
export type UrlLike = URL | { href: string } | { toURL(): URL };

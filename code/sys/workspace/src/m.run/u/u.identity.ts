import { Is, type t } from '../common.ts';

/** Package identity accepted by concise display projections. */
export type PackageIdentityLike = {
  readonly name?: t.StringPkgName;
  readonly path: t.StringPath;
};

/** Prefer the authoritative manifest name and defensively fall back to its workspace path. */
export function packageLabel(item: PackageIdentityLike): string {
  const name = item.name;
  return Is.str(name) && name.trim().length > 0 ? name : item.path;
}

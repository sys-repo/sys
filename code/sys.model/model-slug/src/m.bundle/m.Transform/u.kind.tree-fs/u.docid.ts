import { type t, Is, Path } from './common.ts';

export function normalizeManifestTargets(
  manifests?: t.StringPath | readonly t.StringPath[],
): readonly t.StringPath[] {
  if (!manifests) return [];
  const list = Is.array(manifests) ? manifests : [manifests];
  return list.map((v) => String(v).trim()).filter(Boolean) as readonly t.StringPath[];
}

export function resolveDocid(
  explicit?: t.StringId,
  manifests?: t.StringPath | readonly t.StringPath[],
): t.StringId | undefined {
  const value = String(explicit ?? '').trim();
  if (value) return value as t.StringId;
  const candidates = normalizeManifestTargets(manifests)
    .map((p) => Path.basename(String(p)))
    .map((name) => {
      const match = /^slug-tree\.([^.]+)\.(json|ya?ml)$/i.exec(name);
      return match?.[1];
    })
    .filter((v): v is string => !!v);
  return candidates[0] ? (candidates[0] as t.StringId) : undefined;
}

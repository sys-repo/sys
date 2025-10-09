import { type t, Is, Obj, YamlPipeline } from './common.ts';

export type UseSlugArgs = {
  readonly yaml?: t.EditorYaml;
  readonly path?: t.ObjectPath | string | undefined;
};

export type UseSlugResult = {
  readonly ok: boolean;
  readonly rev: number;
  readonly path: t.ObjectPath;
  readonly result?: t.SlugFromYamlResult;
};

/**
 * Derives a SlugFromYamlResult from the live EditorYaml stream.
 * - Structural only (no semantic rules).
 * - Safe when yaml is absent or not yet ok.
 */
export function useYamlSlug(args: UseSlugArgs): UseSlugResult {
  const { yaml } = args;

  const rev = yaml?.rev ?? 0;
  const path: t.ObjectPath = Is.string(args.path) ? Obj.Path.decode(args.path) : (args.path ?? []);

  if (!yaml?.data?.text?.after) {
    return { ok: false, rev, path };
  }

  const input = yaml.data.text.after; // string form (swap to AST later if desired)
  const result = YamlPipeline.Slug.fromYaml(input, path);

  const ok = result.ok;
  return {
    ok,
    rev,
    path,
    result,
  };
}

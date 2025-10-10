import { type t, Is, Obj, YamlPipeline } from './common.ts';

type Args = {
  readonly yaml?: t.EditorYaml;
  readonly path?: t.ObjectPath | string;
};

export type UseSlugResult = {
  readonly ok: boolean;
  readonly rev: number;
  readonly result?: t.SlugFromYamlResult;
  readonly diagnostics: t.Yaml.Diagnostic[];
};

export function useSlugFromYaml(args: Args): UseSlugResult {
  const rev = args.yaml?.rev ?? 0;
  const path: t.ObjectPath = Is.string(args.path) ? Obj.Path.decode(args.path) : (args.path ?? []);

  const ast = args.yaml?.data?.ast;
  if (!ast) {
    return { ok: false, rev, result: undefined, diagnostics: [] };
  }

  const result = YamlPipeline.Slug.fromYaml(ast, path);
  const diagnostics = YamlPipeline.Slug.Error.normalize(result, 'absolute');
  const ok = result.ok && diagnostics.length === 0;

  return {
    ok,
    rev,
    result,
    diagnostics,
  };
}

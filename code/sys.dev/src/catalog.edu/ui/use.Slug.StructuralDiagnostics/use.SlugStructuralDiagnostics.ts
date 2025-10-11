import { type t, Obj, YamlPipeline } from './common.ts';

export const useSlugStructuralDiagnostics: t.UseSlugFromYaml = (args) => {
  const rev = args.yaml?.rev ?? 0;
  const path = Obj.Path.normalize(args.path, { codec: 'pointer', numeric: true });

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
};

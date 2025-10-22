import { type t, Obj, Slug, YamlPipeline } from './common.ts';

export const useSlugSemanticDiagnostics: t.UseSlugSemanticDiagnostics = (args) => {
  const rev = args.yaml?.rev ?? 0;
  const path = Obj.Path.normalize(args.path, { codec: 'pointer', numeric: true });
  const ast = args.yaml?.data?.ast;

  if (!ast) return { rev, diagnostics: [] };

  // Structural extract first (skip semantic when structure failed)
  const result = YamlPipeline.Slug.fromYaml(ast, path);
  if (!result.ok || !result.slug) return { rev, diagnostics: [] };

  const slug = result.slug;
  const registry = args.registry ?? Slug.Registry.DefaultTraits;

  // Run semantic checks & attach ranges (AST fallback)
  const errs = Slug.Validation.validateWithRanges({ ast, slug, registry, basePath: path });

  // Map to YAML diagnostics, PRESERVING positions
  const diagnostics: t.Yaml.Diagnostic[] = errs.map((e) => {
    const anyE = e as any;
    return {
      message: e.message,
      code: 'slug/semantic',
      path: e.path,
      range: anyE.range, //     ← may be <undefined> if not found
      linePos: anyE.linePos, // ← may be <undefined>
    };
  });

  return { rev, diagnostics };
};

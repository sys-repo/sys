import { type t, DefaultTraitRegistry, Obj, Slug, YamlPipeline } from './common.ts';

/**
 * Semantic diagnostics for a Slug at a YAML path.
 * - Assumes structural/schema validation is handled elsewhere.
 * - Uses the provided trait registry or the catalog default.
 */
export const useSlugSemanticDiagnostics: t.UseSlugSemanticDiagnostics = (args) => {
  const rev = args.yaml?.rev ?? 0;

  // Normalize the incoming path to an RFC6901 pointer (what the pipeline expects).
  const path = Obj.Path.normalize(args.path, { codec: 'pointer', numeric: true });

  // Current AST snapshot from the editor.
  const ast = args.yaml?.data?.ast;
  if (!ast) return { rev, diagnostics: [] };

  // Structural extract first (skip semantic when structure failed).
  const result = YamlPipeline.Slug.fromYaml(ast, path);
  if (!result.ok || !result.slug) return { rev, diagnostics: [] };

  const slug = result.slug;
  const registry = args.registry ?? DefaultTraitRegistry;

  // Run semantic checks & attach ranges (AST fallback).
  const errs = Slug.Validation.validateWithRanges({
    ast,
    slug,
    registry,
    basePath: path,
  });

  // Map to YAML diagnostics (preserve ranges/positions when present).
  const diagnostics: t.Yaml.Diagnostic[] = errs.map((e) => {
    const anyE = e as any; // [range/linePos] are optional on the error objects
    return {
      message: e.message,
      code: 'slug/semantic',
      path: e.path,
      range: anyE.range,
      linePos: anyE.linePos,
    };
  });

  return { rev, diagnostics };
};

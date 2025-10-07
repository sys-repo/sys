import { type t, Obj } from './common.ts';
import { attachSemanticRanges } from './u.slug.err.semantics.ts';

export const normalize: t.YamlSlugErrorLib['normalize'] = (yaml, args) => {
  const { pathMode = 'absolute' } = args;

  // Ensure schema/semantic errors have ranges (mutates the arrays in-place).
  type Errs = t.Schema.ValidationError[];
  attachSemanticRanges(yaml.ast, yaml.errors.schema as Errs);
  attachSemanticRanges(yaml.ast, yaml.errors.semantic as Errs);

  const base = yaml.path;
  const map = (e: t.Schema.ValidationError): t.Yaml.Diagnostic => ({
    message: e.message,
    code: pickCode(e),
    path: Obj.Path.join(base, e.path, pathMode),
    range: e.range as t.Yaml.Range | undefined,
  });

  const schemaDiagnostics = (yaml.errors.schema ?? []).map(map);
  const semanticDiagnostics = (yaml.errors.semantic ?? []).map(map);

  return [...schemaDiagnostics, ...semanticDiagnostics];
};

/**
 * Helpers:
 */
const pickCode = (e: unknown): string | undefined => {
  const v = (e as { code?: unknown } | undefined)?.code;
  return typeof v === 'string' ? v : undefined;
};

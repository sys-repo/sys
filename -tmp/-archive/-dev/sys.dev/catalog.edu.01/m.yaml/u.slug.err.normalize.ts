import { type t, Obj } from './common.ts';
import { attachSemanticRanges } from './u.slug.err.semantics.ts';

type N = t.YamlSlugErrorLib['normalize'];

export const normalize: N = (yaml, args) => {
  const { mode: pathMode = 'absolute' } = wrangle.args(args);

  type Errs = t.Schema.ValidationError[];
  attachSemanticRanges(yaml.ast, yaml.errors.schema as Errs);
  attachSemanticRanges(yaml.ast, yaml.errors.semantic as Errs);

  const base = yaml.path;
  const map =
    (kind: 'schema' | 'semantic') =>
    (e: t.Schema.ValidationError): t.Yaml.Diagnostic => {
      const abs = Obj.Path.join(base, e.path, 'absolute');
      const rel = Obj.Path.join(base, e.path, 'relative');
      const chosen = pathMode === 'absolute' ? abs : rel;

      // Pointer text (eg. "/foo/bar"), empty string if no path:
      const at = chosen && chosen.length > 0 ? Obj.Path.encode(chosen) : '';
      const code = pickCode(e);
      const message = `[slug/${kind}] ${e.message}${at ? ` at ${at}` : ''}${code ? ` [${code}]` : ''}`;
      return { message, code, path: chosen, range: e.range };
    };

  const schemaDiagnostics = (yaml.errors.schema ?? []).map(map('schema'));
  const semanticDiagnostics = (yaml.errors.semantic ?? []).map(map('semantic'));

  return [...schemaDiagnostics, ...semanticDiagnostics];
};

/**
 * Helpers:
 */
const pickCode = (e: unknown): string | undefined => {
  const v = (e as { code?: unknown } | undefined)?.code;
  return typeof v === 'string' ? v : undefined;
};

const wrangle = {
  args(input: Parameters<N>[1]): t.YamlSlugErrorNormalizeOptions {
    if (typeof input === 'string') return { mode: input };
    return input ?? { mode: 'absolute' };
  },
} as const;

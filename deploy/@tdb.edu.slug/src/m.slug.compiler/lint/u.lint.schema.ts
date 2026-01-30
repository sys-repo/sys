import { Schema, Yaml } from './common.ts';
import { LintDocFacets, type t } from './common.ts';

/**
 * Lint profile YAML schema (authoritative config).
 * Runtime validated via JsonSchema (typebox) Value.Check/Errors.
 */
export const LintProfileSchema = {
  /**
   * Typed initial document.
   * (YAML can omit optionals; but having explicit defaults is fine.)
   */
  initial(): t.LintProfileDoc {
    return {
      facets: [...LintDocFacets],
      'fs:slug-tree': {
        include: ['.md'],
        source: '.',
        target: { manifest: ['./manifest/slug-tree.json', './manifest/slug-tree.yaml'] },
      },
    };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(LintProfileSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(LintProfileSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * Serialize a lint profile document to YAML.
   */
  stringify(doc: t.LintProfileDoc): string {
    const raw = Yaml.stringify(doc).data ?? '';
    return formatInlineInclude(formatRootSpacing(raw));
  },

  /**
   * Serialize the initial document to YAML.
   */
  initialYaml(): string {
    return LintProfileSchema.stringify(LintProfileSchema.initial());
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      facets: Schema.Type.Optional(
        Schema.Type.Array(
          Schema.Type.Union(LintDocFacets.map((facet) => Schema.Type.Literal(facet))),
          { minItems: 0 },
        ),
      ),
      'fs:slug-tree': Schema.Type.Optional(
        Schema.Type.Object(
          {
            source: Schema.Type.Optional(Schema.Type.String()),
            target: Schema.Type.Optional(
              Schema.Type.Object(
                {
                  manifest: Schema.Type.Optional(
                    Schema.Type.Union([
                      Schema.Type.String(),
                      Schema.Type.Array(Schema.Type.String(), { minItems: 0 }),
                    ]),
                  ),
                  crdt: Schema.Type.Optional(
                    Schema.Type.Object(
                      {
                        ref: Schema.Type.Optional(Schema.Type.String()),
                        path: Schema.Type.Optional(Schema.Type.String()),
                      },
                      { additionalProperties: false },
                    ),
                  ),
                },
                { additionalProperties: false },
              ),
            ),
            include: Schema.Type.Optional(Schema.Type.Array(Schema.Type.String(), { minItems: 0 })),
            ignore: Schema.Type.Optional(Schema.Type.Array(Schema.Type.String(), { minItems: 0 })),
            sort: Schema.Type.Optional(Schema.Type.Boolean()),
            readmeAsIndex: Schema.Type.Optional(Schema.Type.Boolean()),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;

function formatRootSpacing(input: string): string {
  const lines = input.split('\n');
  const out: string[] = [];
  let sawRoot = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isRootKey =
      trimmed.length > 0 &&
      !line.startsWith(' ') &&
      !trimmed.startsWith('-') &&
      trimmed.includes(':');
    if (isRootKey) {
      if (sawRoot && out[out.length - 1] !== '') out.push('');
      sawRoot = true;
    }
    out.push(line);
  }
  return out.join('\n');
}

function formatInlineInclude(input: string): string {
  const lines = input.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== 'include:' || i + 1 >= lines.length) {
      out.push(line);
      continue;
    }
    const next = lines[i + 1];
    const match = next.match(/^\s*-\s*(.+)\s*$/);
    if (!match) {
      out.push(line);
      continue;
    }
    const value = match[1];
    const indent = line.match(/^\s*/)?.[0] ?? '';
    out.push(`${indent}include: [${value}]`);
    i += 1;
  }
  return out.join('\n');
}

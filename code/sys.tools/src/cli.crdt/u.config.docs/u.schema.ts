import { type t, Crdt, Yaml } from '../common.ts';
import { Schema } from '@sys/schema';

/**
 * Document YAML schema (authoritative config).
 */
export const CrdtDocSchema = {
  /**
   * Typed initial document.
   */
  initial(id: t.StringId = ''): t.CrdtTool.DocumentYaml.Doc {
    return { id };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(CrdtDocSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(CrdtDocSchema.schema, value)];
    if (!ok) return { ok, errors } as const;

    const doc = value as t.CrdtTool.DocumentYaml.Doc;
    if (!Crdt.Is.id(doc.id)) {
      const err = Schema.Value.Errors(
        Schema.Type.Object({ id: Schema.Type.String() }, { additionalProperties: true }),
        { id: doc.id },
      );
      return { ok: false, errors: [...err] } as const;
    }

    return { ok: true, errors: [] } as const;
  },

  /**
   * Render YAML content for a document.
   */
  stringify(doc: t.CrdtTool.DocumentYaml.Doc): string {
    const res = Yaml.stringify(doc);
    if (res.error || !res.data) return '';
    return res.data;
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      id: Schema.Type.String(),
      name: Schema.Type.Optional(Schema.Type.String()),
    },
    { additionalProperties: false },
  ),
} as const;

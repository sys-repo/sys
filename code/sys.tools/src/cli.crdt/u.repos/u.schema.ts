import { type t, Yaml } from '../common.ts';
import { Schema } from '@sys/schema';

/**
 * Repo YAML schema (authoritative config).
 */
export const CrdtRepoSchema = {
  /**
   * Typed initial document.
   */
  initial(): t.CrdtTool.RepoYaml.Doc {
    return { sync: [] };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(CrdtRepoSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(CrdtRepoSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * Render YAML content for a repo.
   */
  stringify(doc: t.CrdtTool.RepoYaml.Doc): string {
    const res = Yaml.stringify(doc);
    if (res.error || !res.data) return '';
    return res.data;
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      sync: Schema.Type.Array(Schema.Type.String()),
    },
    { additionalProperties: false },
  ),
} as const;

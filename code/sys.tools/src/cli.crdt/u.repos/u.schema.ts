import { type t, Is, Yaml } from '../common.ts';
import { Schema } from '@sys/schema';

export const DEFAULT_PORTS = {
  repo: 49494,
  sync: 3030,
} as const;

/**
 * Repo YAML schema (authoritative config).
 */
export const CrdtRepoSchema = {
  /**
   * Typed initial document.
   */
  initial(): t.CrdtTool.RepoYaml.Doc {
    return { sync: [], ports: { ...DEFAULT_PORTS } };
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
   * Ensure ports are present with defaults.
   */
  withDefaultPorts(doc: t.CrdtTool.RepoYaml.Doc): t.CrdtTool.RepoYaml.Doc {
    const ports = doc.ports ?? {};
    return {
      ...doc,
      ports: {
        repo: Is.num(ports.repo) ? ports.repo : DEFAULT_PORTS.repo,
        sync: Is.num(ports.sync) ? ports.sync : DEFAULT_PORTS.sync,
      },
    };
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      sync: Schema.Type.Array(Schema.Type.String()),
      ports: Schema.Type.Optional(
        Schema.Type.Object(
          {
            repo: Schema.Type.Optional(Schema.Type.Number()),
            sync: Schema.Type.Optional(Schema.Type.Number()),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;

import { Schema as SchemaBase, type t } from './common.ts';

const T = SchemaBase.Type;

/** Minimal authored Shell.Structure root schema. */
export const StructureSchema = T.Object(
  {
    kind: T.Literal('shell.structure'),
    version: T.Literal(1),
    name: T.Optional(T.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

/** Schema helpers for Shell.Structure values. */
export const Schema: t.ShellStructure.Schema.Lib = {
  structure: StructureSchema,
  validate(input) {
    const errors: t.ShellStructure.Schema.Issue[] = [];
    for (const error of SchemaBase.Value.Errors(StructureSchema, input)) {
      errors.push({ kind: 'schema', path: error.path || '<root>', message: error.message });
    }
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: input as t.ShellStructure.Structure, errors: [] };
  },
};

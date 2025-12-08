import { type t, Schema, toSchema } from './common.ts';
import { SequenceRecipe, normalizeEditorSequenceForTypedYaml } from '../sequence/mod.ts';
import { makeParser } from '../u.parser.ts';

const TB = Schema.Value;
const SequenceSchema = toSchema(SequenceRecipe);

export async function lintTypedYamlSequence(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  docId: t.Crdt.Id,
  opts: { debug?: boolean } = {},
): Promise<t.LintResult> {
  const Parse = makeParser(yamlPath);
  const node = Parse.findParsedNode(dag, docId);
  if (!node) return { issues: [] };

  let sequence = normalizeEditorSequenceForTypedYaml(Parse.Lens.sequence.get(node.slug));
  if (!sequence) return { issues: [] };

  // Fast pass
  if (TB.Check(SequenceSchema, sequence)) {
    return { issues: [] };
  }

  // Slow path
  const errors = Array.from(TB.Errors(SequenceSchema, sequence));

  const issues: t.LintIssue[] = errors.map((err) => ({
    kind: 'schema:sequence',
    message: err.message,
    path: `sequence${err.path ?? ''}`,
  }));

  return { issues };
}

import { normalizeEditorSequenceForTypedYaml, SequenceRecipe } from '../sequence/mod.ts';
import { makeParser } from '../u.parser.ts';
import { type t, c, Schema, toSchema, Obj } from './common.ts';

type O = Record<string, unknown>;
const TB = Schema.Value;
const SequenceSchema = toSchema(SequenceRecipe);

export async function lintTypedYamlSequence(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  docId: t.Crdt.Id,
  opts: { debug?: boolean } = {},
): Promise<t.LintResult> {
  const { debug = false } = opts;

  const Parse = makeParser(yamlPath);
  const node = Parse.findParsedNode(dag, docId);
  if (!node) return { issues: [] };

  let sequence = normalizeEditorSequenceForTypedYaml(Parse.Lens.sequence.get(node.slug));
  if (!sequence) return { issues: [] };

  // Fast pass:
  if (TB.Check(SequenceSchema, sequence)) {
    return { issues: [] };
  }

  // Slow path:
  const errors = Array.from(TB.Errors(SequenceSchema, sequence));
  if (debug) {
    console.info(`${c.cyan('Lint Errors:')} ${import.meta.filename}`);
    errors.forEach((error) => {
      console.info(c.cyan(docId));
      console.info(`${c.cyan('Lint error:')} ${error.schema.title}`);
      console.info('  path:', error.path);
      console.info('  message:', error.message);
      console.info('  value:', JSON.stringify(error.value, null, 2));
    });
  }

  const issues: t.LintIssue[] = errors.map((err) => ({
    kind: 'schema:sequence',
    message: err.message,
    path: `sequence${err.path ?? ''}`,
  }));

  return { issues };
}

import { Sequence, SequenceSchema } from '../sequence/mod.ts';
import { makeParser } from '../u.parser.ts';
import { type t, c, Schema } from './common.ts';

const T = Schema.Value;

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

  let sequence = await Sequence.fromDag(dag, yamlPath, docId, { validate: false });
  if (!sequence) return { issues: [] };

  // Fast pass:
  if (T.Check(SequenceSchema, sequence)) {
    return { issues: [] };
  }

  // Slow path:
  const errors = Array.from(T.Errors(SequenceSchema, sequence));
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

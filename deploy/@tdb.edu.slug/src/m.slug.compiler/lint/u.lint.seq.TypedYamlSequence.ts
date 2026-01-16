import { Sequence, SequenceSchema } from '../slug.MediaComposition.Sequence/mod.ts';
import { checkSequenceInvariants } from '../slug.MediaComposition.Sequence/u.schema.validate.invariants.ts';
import { type t, c, Slug, Schema } from './common.ts';

const T = Schema.Value;
const FACETS = ['sequence:schema'] as const;

const empty = (): t.DocLintResult => ({
  ok: true,
  facets: [...FACETS],
  issues: [],
});

const finalize = (issues: readonly t.DocLintIssue[]): t.DocLintResult => ({
  ok: issues.length === 0,
  facets: [...FACETS],
  issues,
});

export async function lintTypedYamlSequence(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: { debug?: boolean; checkInvariants?: boolean } = {},
): Promise<t.DocLintResult> {
  const { debug = false, checkInvariants = false } = opts;

  const Parse = Slug.parser(yamlPath);
  const node = Parse.findParsedNode(dag, docid);
  if (!node) return empty();

  /**
   * We deliberately ask for the *normalized* sequence but opt out of
   * Sequence.validate's own error handling here so we can:
   *
   * - run the schema check ourselves (to produce per-path issues), and
   * - optionally run the invariant checks under a feature flag.
   */
  const result = await Sequence.fromDag(dag, yamlPath, docid, { validate: false });
  if (!result.ok) {
    // Authoring-time lints for "cannot even derive a sequence" live elsewhere.
    // Here we only care about typed-YAML/schema-level issues.
    return empty();
  }

  const sequence = result.sequence;
  const issues: t.DocLintIssue[] = [];

  /**
   * First pass: structural/schema validation via TypeBox.
   * If this fails, we return detailed per-path schema issues.
   */
  const schemaOk = T.Check(SequenceSchema, sequence);

  if (!schemaOk) {
    const errors = Array.from(T.Errors(SequenceSchema, sequence));

    if (debug) {
      console.info(`${c.cyan('Lint Errors:')} ${import.meta.filename}`);
      errors.forEach((error) => {
        console.info(c.cyan(docid));
        console.info(`${c.cyan('Lint error:')} ${error.schema.title}`);
        console.info('  path:', error.path);
        console.info('  message:', error.message);
        console.info('  value:', JSON.stringify(error.value, null, 2));
      });
    }

    issues.push(
      ...errors.map((err) => ({
        kind: 'schema:sequence',
        path: `sequence${err.path ?? ''}`,
        message: err.message,
        doc: { id: docid },
      })),
    );

    return finalize(issues);
  }

  /**
   * Second pass: semantic invariants that sit on top of the schema.
   * These are the same invariants enforced by validateSequence/fromDag
   * and therefore by Sequence.toPlaybackSpec.
   */
  if (checkInvariants) {
    const message = checkSequenceInvariants(sequence);
    if (message) {
      issues.push({
        kind: 'schema:sequence',
        path: 'sequence',
        message,
        doc: { id: docid },
      });
    }
  }

  return finalize(issues);
}

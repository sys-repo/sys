import { makeParser } from '../u.parser.ts';

import { type t, c, Cli, DocLintFacets as Facets, Obj } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { lintSequenceFilepaths } from './u.lint.seq.filepaths.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';

/**
 * Lint namespace.
 */
export const Linter = {
  run,
  Facets,
  Facet: {
    lintAliases,
    lintSequenceFilepaths,
    lintTypedYamlSequence,
  },
} as const;

/**
 * Lint across the given DAG.
 */
async function run(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  opts: { facets?: t.DocLintFacet[]; interactive?: boolean } = {},
): Promise<t.DocLintResult> {
  const { interactive = false } = opts;
  const issues: t.DocLintIssue[] = [];
  const Parse = makeParser(yamlPath);

  /**
   * Determine facets to lint on.
   */
  let facets = opts.facets ?? ['aliases', 'sequence:schema', 'sequence:filepaths'];
  if (interactive) {
    const opt = (value: t.DocLintFacet, checked?: boolean) => ({
      name: `${value}`,
      value,
      checked,
    });
    const options = Facets.map((value) => opt(value, facets.includes(value)));
    facets = (await Cli.Prompt.Checkbox.prompt({
      message: 'Select lint on facets',
      options,
      check: c.green('●'),
      uncheck: c.gray('○'),
    })) as t.DocLintFacet[];
  }

  /**
   * Lint each Alias table in the DAG.
   */
  if (facets.includes('aliases')) {
    for (const node of dag.nodes) {
      const slug = Parse.findParsedNode(dag, node.id);
      const alias = slug?.alias;
      if (!alias) continue;

      const baseResult = lintAliases(alias.resolver.alias);
      const issuesForNode: t.DocLintIssue[] = baseResult.issues.map((issue) => ({
        ...issue,
        doc: { id: node.id },
      }));

      printLintSection(issuesForNode);
      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  /**
   * Lint sequence file paths.
   */
  if (facets.includes('sequence:filepaths')) {
    for (const node of dag.nodes) {
      const baseResult = await lintSequenceFilepaths(dag, yamlPath, node.id);
      const issuesForNode: t.DocLintIssue[] = baseResult.issues.map((issue) => ({
        ...issue,
        doc: { id: node.id },
      }));

      printLintSection(issuesForNode);
      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  /**
   * Lint sequence data-structure shape.
   */
  if (facets.includes('sequence:schema')) {
    for (const node of dag.nodes) {
      const baseResult = await lintTypedYamlSequence(dag, yamlPath, node.id);
      const issuesForNode: t.DocLintIssue[] = baseResult.issues.map((issue) => ({
        ...issue,
        doc: { id: node.id },
      }));

      printLintSection(issuesForNode);
      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  /**
   * Final result
   */
  const ok = issues.length === 0;
  const total = { issues: issues.length };
  return Obj.asGetter({ ok, total, facets, issues }, ['issues']);
}

/**
 * Centralized formatted output for a linter module.
 * Expects issues that already carry `docId`.
 */
function printLintSection(issues: t.DocLintIssue[] = []) {
  if (issues.length === 0) return;
  const table = Fmt.lintResults(issues);
  if (table) console.info(table + '\n');
}

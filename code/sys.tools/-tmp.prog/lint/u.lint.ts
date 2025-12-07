import { type t, Obj } from '../common.ts';
import { makeParser } from '../u.parser.ts';
import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { lintSequenceFilepaths } from './u.lint.seq.filepaths.ts';

export async function lint(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
): Promise<t.DocLintResult> {
  const Parse = makeParser(yamlPath);
  const allIssues: t.DocLintIssue[] = [];

  /**
   * Lint each node in the DAG.
   */
  for (const node of dag.nodes) {
    const slug = Parse.findParsedNode(dag, node.id);
    const alias = slug?.alias;
    if (!alias) continue;

    const baseResult = lintAliases(alias.resolver.alias);

    // Attach docId to each issue for this node.
    const issuesForNode: t.DocLintIssue[] = baseResult.issues.map((issue) => ({
      ...issue,
      doc: { id: node.id },
    }));

    printLintSection(issuesForNode);
    for (const issue of issuesForNode) {
      allIssues.push(issue);
    }
  }

  /**
   * Lint sequence file paths
   */
  for (const node of dag.nodes) {
    const baseResult = await lintSequenceFilepaths(dag, yamlPath, node.id);

    const issuesForNode: t.DocLintIssue[] = baseResult.issues.map((issue) => ({
      ...issue,
      doc: { id: node.id },
    }));

    printLintSection(issuesForNode);
    for (const issue of issuesForNode) {
      allIssues.push(issue);
    }
  }

  /**
   * Final result
   */
  const ok = allIssues.length === 0;
  const total = { issues: allIssues.length };

  return Obj.asGetter({ ok, total, issues: allIssues }, ['issues']);
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

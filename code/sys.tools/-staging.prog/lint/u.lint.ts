import { type t, c, Cli, DocLintFacets as Facets, makeParser, Obj } from './common.ts';

import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { bundleSequenceFilepaths } from './u.lint.seq.files.bundle.ts';
import { lintSequenceFilepaths } from './u.lint.seq.files.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';

type Issue = t.DocLintIssue;

/**
 * Lint namespace.
 */
export const Linter = {
  run,
  Facets,
  Facet: { lintAliases, lintSequenceFilepaths, lintTypedYamlSequence },
} as const;

/**
 * Lint across the given DAG.
 */
async function run(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  opts: { facets?: string[]; interactive?: boolean } = {},
): Promise<t.LintAggregateResult> {
  const { interactive = false } = opts;
  const issues: Issue[] = [];
  const Parse = makeParser(yamlPath);

  // Determine facets to lint on.
  let facets = (opts.facets ?? Facets) as t.DocLintFacet[];
  facets = facets.filter((facet) => Facets.includes(facet)); // Ensure facet exists in supported set.

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

  const hasFileVideo = facets.includes('sequence:file:video');
  const hasFileImage = facets.includes('sequence:file:image');
  const hasFilesBundle = facets.includes('sequence:files:bundle');

  const spinner = Cli.spinner();
  spinner.start();

  /**
   * Lint each Alias table in the DAG.
   */
  if (facets.includes('aliases')) {
    spinner.text = Fmt.spinnerText('aliases...');
    for (const node of dag.nodes) {
      const slug = Parse.findParsedNode(dag, node.id);
      const alias = slug?.alias;
      if (!alias) continue;

      const id = node.id;
      const baseResult = lintAliases(alias.resolver.alias);
      const issuesForNode: Issue[] = baseResult.issues.map((issue) => ({ ...issue, doc: { id } }));
      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  /**
   * Lint sequence file paths (only when not bundling).
   * When `sequence:files:bundle` is selected, the bundler performs the same
   * lint behaviour to avoid duplicate issues.
   */
  if (!hasFilesBundle && (hasFileVideo || hasFileImage)) {
    spinner.text = Fmt.spinnerText('asset files...');
    for (const node of dag.nodes) {
      const id = node.id;
      const baseResult = await lintSequenceFilepaths(dag, yamlPath, node.id, { facets });
      const issuesForNode: Issue[] = baseResult.issues.map((issue) => ({ ...issue, doc: { id } }));
      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  /**
   * Bundle sequence file paths to hashed assets + manifest.
   * This reuses the same lint semantics as `lintSequenceFilepaths`.
   */
  if (hasFilesBundle) {
    let index = 0;
    const total = dag.nodes.length;
    for (const node of dag.nodes) {
      index++;
      let msg = `bundling assets for ${Fmt.prettyUri(node.id)} (${index} of ${total})...`;
      spinner.text = Fmt.spinnerText(msg);

      const id = node.id;
      const baseResult = await bundleSequenceFilepaths(dag, yamlPath, node.id, { facets });
      const issuesForNode: Issue[] = baseResult.issues.map((issue) => ({ ...issue, doc: { id } }));
      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  /**
   * Lint sequence data-structure shape.
   */
  if (facets.includes('sequence:schema')) {
    for (const node of dag.nodes) {
      const id = node.id;
      const baseResult = await lintTypedYamlSequence(dag, yamlPath, node.id);
      const issuesForNode: Issue[] = baseResult.issues.map((issue) => ({ ...issue, doc: { id } }));

      issuesForNode.forEach((issue) => issues.push(issue));
    }
  }

  spinner.stop();

  /**
   * Final aggregated output.
   */
  printLintSection(issues);

  const ok = issues.length === 0;
  return Obj.asGetter({ ok, facets, issues }, ['issues']);
}

/**
 * Centralized formatted output for a linter module.
 * Expects issues that already carry `docid`.
 */
function printLintSection(issues: Issue[] = []) {
  if (issues.length === 0) return;
  const table = Fmt.lintResults(issues);
  if (table) console.info(table + '\n');
}

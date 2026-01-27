import { type t, c, Cli, LintDocFacets as Facets, Fs, Obj, Pkg, pkg, Slug } from './common.ts';

import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { bundleSequenceFilepaths } from './u.lint.seq.files.bundle.ts';
import { lintSequenceFilepaths } from './u.lint.seq.files.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';
import { selectSlugLintProfile } from './u.slug.profiles.ts';

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
  opts: { facets?: string[]; interactive?: boolean; cwd?: t.StringDir } = {},
): Promise<t.DocLintResult> {
  const { interactive = false } = opts;
  const issues: Issue[] = [];
  const Parse = Slug.parser(yamlPath);

  if (opts.cwd) {
    const profile = await selectSlugLintProfile(opts.cwd, { interactive });
    if (interactive && !profile) {
      return Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);
    }
  }

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
    facets = (await Cli.Input.Checkbox.prompt({
      message: 'Select lint on facets',
      options,
    })) as t.DocLintFacet[];
  }

  const hasFileVideo = facets.includes('sequence:file:video');
  const hasFileImage = facets.includes('sequence:file:image');
  const hasFilesBundle = facets.includes('sequence:files:bundle');

  const spinner = Cli.spinner();
  spinner.start();

  type WithIssues<I> = { readonly issues: readonly I[] };
  type WithDoc = { readonly doc: { readonly id: t.StringId } };
  const extractIssues = <I>(input: unknown): readonly I[] => {
    if (Array.isArray(input)) return input as readonly I[];
    const obj = input as Partial<WithIssues<I>> | null;
    const maybe = obj?.issues;
    return Array.isArray(maybe) ? maybe : [];
  };

  const hasDoc = (issue: unknown): issue is WithDoc => {
    const x = issue as Partial<WithDoc> | null;
    return !!x?.doc && typeof x.doc.id === 'string';
  };

  const asObj = (v: unknown): Record<string, unknown> => {
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  };

  const withDoc = (issue: unknown, id: t.StringId): Issue => {
    return Object.assign({}, asObj(issue), { doc: { id } }) as Issue;
  };

  const pushIssuesForDoc = (id: t.StringId, input: unknown) => {
    const src = extractIssues<Issue>(input);
    for (const issue of src) {
      issues.push(hasDoc(issue) ? issue : withDoc(issue, id));
    }
  };

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
      const baseResult = lintAliases(id, alias.resolver.alias);
      pushIssuesForDoc(id, baseResult);
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
      pushIssuesForDoc(id, baseResult);
    }
  }

  /**
   * Bundle sequence file paths to hashed assets + manifest.
   * This reuses the same lint semantics as `lintSequenceFilepaths`.
   */
  if (hasFilesBundle) {
    let index = 0;
    const total = dag.nodes.length;

    type R = t.LintAndBundleResult;
    const distDirs = new Set<t.StringDir>();
    const addDir = (res: R) => {
      distDirs.add(Fs.join(res.dir.base, res.dir.manifests));
      distDirs.add(Fs.join(res.dir.base, res.dir.video));
      distDirs.add(Fs.join(res.dir.base, res.dir.image));
    };

    /** Process DAG nodes */
    for (const node of dag.nodes) {
      index++;
      const msg = `bundling assets for ${Fmt.prettyUri(node.id)} (${c.white(String(index))} of ${total})...`;
      spinner.text = Fmt.spinnerText(msg);

      const id = node.id;
      const result = await bundleSequenceFilepaths(dag, yamlPath, node.id, { facets });

      pushIssuesForDoc(id, result);
      addDir(result);
    }

    /** Generate `dist.json` manifests */
    spinner.text = Fmt.spinnerText(`generating dist.json manifests`);
    for (const dir of distDirs) {
      if (await Fs.exists(dir)) {
        const name = `prog.bundle.slug/${Fs.basename(dir)}`;
        const version = '0.0.0';
        await Pkg.Dist.compute({ dir, pkg: { name, version }, builder: pkg, save: true });
      }
    }
  }

  /**
   * Lint sequence data-structure shape.
   */
  if (facets.includes('sequence:schema')) {
    for (const node of dag.nodes) {
      const id = node.id;
      const baseResult = await lintTypedYamlSequence(dag, yamlPath, node.id, {
        checkInvariants: true,
        debug: false,
      });
      pushIssuesForDoc(id, baseResult);
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

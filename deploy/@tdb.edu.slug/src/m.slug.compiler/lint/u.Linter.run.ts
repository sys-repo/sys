import { type t, c, Cli, SlugLintFacets as Facets, Fs, Obj, Pkg, pkg, Slug } from './common.ts';

import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import {
  type SlugLintProfilePick,
  selectSlugLintProfile,
  selectSlugLintProfileAction,
} from './u.lint.menu.ts';
import { bundleSequenceFilepaths } from './u.lint.seq.files.bundle.ts';
import { lintSequenceFilepaths } from './u.lint.seq.files.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';
import { printSummary } from './u.lint.print.ts';
import { runSlugTreeFs } from './u.lint.slug-tree.ts';
import { readLintProfile, writeLintProfile } from './u.lint.util.ts';

type Issue = t.SlugLintIssue;

/**
 * Lint across the given DAG.
 */
export async function run(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  opts: {
    facets?: string[];
    interactive?: boolean;
    cwd: t.StringDir;
    createCrdt?: () => Promise<t.StringRef>;
    print?: boolean;
  },
): Promise<t.SlugLintResult> {
  const { interactive = false } = opts;
  let facets = normalizeFacets(opts.facets);

  if (opts.cwd && interactive) {
    return await runInteractiveLint({ dag, yamlPath, facets, opts });
  }

  let profilePath: t.StringFile | undefined;
  if (opts.cwd) {
    const res = await selectProfileOnce(opts.cwd, facets, interactive);
    profilePath = res.profilePath;
    facets = res.facets;
  }

  return await lintOnce({ dag, yamlPath, facets, profilePath, opts });
}

/**
 * Single-pass lint execution for a given DAG and facet set.
 * Used by both interactive and non-interactive flows to keep behavior consistent.
 */
async function lintOnce(args: {
  dag: t.Graph.Dag.Result;
  yamlPath: t.ObjectPath;
  facets: readonly t.SlugLintFacet[];
  profilePath?: t.StringFile;
  opts: {
    facets?: string[];
    interactive?: boolean;
    cwd: t.StringDir;
    createCrdt?: () => Promise<t.StringRef>;
  };
}): Promise<t.SlugLintResult> {
  const issues: Issue[] = [];
  const Parse = Slug.parser(args.yamlPath);
  let facets = [...args.facets];
  const profilePath = args.profilePath;
  const { dag, yamlPath, opts } = args;
  const cwd = opts.cwd;
  if (!cwd) return Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);

  const hasFileVideo = facets.includes('sequence:file:video');
  const hasFileImage = facets.includes('sequence:file:image');
  const hasFilesBundle = facets.includes('slug-tree:seq:bundle');
  const hasSlugTree = facets.includes('slug-tree:fs:bundle');

  if (hasSlugTree && !opts.createCrdt) {
    const msg = `warning: slug-tree:fs:bundle skipped (createCrdt not provided in Linter.run options)`;
    console.info(c.yellow(msg));
    facets = facets.filter((facet) => facet !== 'slug-tree:fs:bundle');
  }
  if (hasSlugTree && !profilePath) {
    console.info(c.yellow('warning: slug-tree:fs:bundle skipped (no lint profile selected)'));
    facets = facets.filter((facet) => facet !== 'slug-tree:fs:bundle');
  }

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
   * Generate slug-tree artifacts from the filesystem.
   */
  if (facets.includes('slug-tree:fs:bundle') && profilePath && opts.cwd && opts.createCrdt) {
    await runSlugTreeFs({
      cwd: opts.cwd,
      profilePath,
      createCrdt: opts.createCrdt,
    });
  }

  /**
   * Lint sequence file paths (only when not bundling).
   * When `slug-tree:seq:bundle` is selected, the bundler performs the same
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
 * Resolve the profile once for non-interactive runs.
 * Keeps profile selection separate from the lint execution pass.
 */
async function selectProfileOnce(
  cwd: t.StringDir,
  facets: readonly t.SlugLintFacet[],
  interactive: boolean,
): Promise<{ profilePath?: t.StringFile; facets: t.SlugLintFacet[] }> {
  const profilePick: SlugLintProfilePick = await selectSlugLintProfile(cwd, { interactive });
  if (profilePick.kind === 'exit') return { facets: [...facets] };
  if ('profile' in profilePick && profilePick.profile) {
    const doc = await readLintProfile(profilePick.profile);
    const resolved = resolveFacets({ current: facets, doc });
    return { profilePath: profilePick.profile, facets: resolved };
  }
  return { facets: [...facets] };
}

/**
 * Interactive profile + facet menu loop.
 * Runs lint on demand and keeps the menu state in sync.
 */
async function runInteractiveLint(args: {
  dag: t.Graph.Dag.Result;
  yamlPath: t.ObjectPath;
  facets: t.SlugLintFacet[];
  opts: {
    facets?: string[];
    interactive?: boolean;
    cwd: t.StringDir;
    createCrdt?: () => Promise<t.StringRef>;
    print?: boolean;
  };
}): Promise<t.SlugLintResult> {
  const { dag, yamlPath, opts } = args;
  const cwd = opts.cwd;
  let { facets } = args;
  let profilePath: t.StringFile | undefined;
  let lastResult: t.SlugLintResult | undefined;
  let lastProfile: t.StringFile | undefined;
  let lastAction: 'facets' | 'run' | undefined;

  profileLoop: while (true) {
    let actionPick: SlugLintProfilePick = await selectSlugLintProfile(cwd, {
      interactive: true,
      defaultProfile: lastProfile,
    });

    if (actionPick.kind === 'exit') {
      return lastResult ?? Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);
    }
    if ('profile' in actionPick && actionPick.profile) {
      lastProfile = actionPick.profile;
      profilePath = actionPick.profile;
      const doc = await readLintProfile(actionPick.profile);
      facets = resolveFacets({ current: facets, doc });
    }

    while (true) {
      if (actionPick.kind === 'facets') {
        facets = await promptForFacets(facets);
        if (actionPick.profile) {
          const doc = await readLintProfile(actionPick.profile);
          await writeLintProfile(actionPick.profile, { ...doc, facets });
        }
        lastAction = 'facets';
        actionPick = await selectSlugLintProfileAction(cwd, actionPick.profile, {
          defaultAction: lastAction,
        });
        if ('profile' in actionPick && actionPick.profile) {
          lastProfile = actionPick.profile;
          profilePath = actionPick.profile;
          const doc = await readLintProfile(actionPick.profile);
          facets = resolveFacets({ current: facets, doc });
        }
        continue;
      }

      if (actionPick.kind === 'run') {
        lastAction = 'run';
        lastResult = await lintOnce({
          dag,
          yamlPath,
          facets,
          profilePath,
          opts,
        });
        if (lastResult && opts.print !== false) {
          printSummary({ res: lastResult, docpath: yamlPath });
        }
        actionPick = await selectSlugLintProfileAction(cwd, actionPick.profile, {
          defaultAction: lastAction,
        });
        if ('profile' in actionPick && actionPick.profile) {
          lastProfile = actionPick.profile;
          profilePath = actionPick.profile;
          const doc = await readLintProfile(actionPick.profile);
          facets = resolveFacets({ current: facets, doc });
        }
        continue;
      }

      if (actionPick.kind === 'exit') {
        return lastResult ?? Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);
      }
      if (actionPick.kind === 'back') {
        if ('profile' in actionPick && actionPick.profile) {
          lastProfile = actionPick.profile;
          profilePath = actionPick.profile;
        }
        lastAction = undefined;
        continue profileLoop;
      }
      break;
    }
  }
}

/**
 * Helpers:
 */

async function promptForFacets(current: readonly t.SlugLintFacet[]): Promise<t.SlugLintFacet[]> {
  const opt = (value: t.SlugLintFacet, checked?: boolean) => ({ name: `${value}`, value, checked });
  const options = Facets.map((value) => opt(value, current.includes(value)));
  return (await Cli.Input.Checkbox.prompt({
    message: 'Select lint on facets',
    options,
  })) as t.SlugLintFacet[];
}

function normalizeFacets(input?: readonly string[]): t.SlugLintFacet[] {
  const isFacet = (value: string): value is t.SlugLintFacet =>
    Facets.includes(value as t.SlugLintFacet);
  return (input ?? Facets).filter(isFacet) as t.SlugLintFacet[];
}

function resolveFacets(args: {
  current: readonly t.SlugLintFacet[];
  doc: t.SlugLintProfile;
}): t.SlugLintFacet[] {
  const src = args.doc.facets ?? args.current;
  return src.filter((facet) => Facets.includes(facet));
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

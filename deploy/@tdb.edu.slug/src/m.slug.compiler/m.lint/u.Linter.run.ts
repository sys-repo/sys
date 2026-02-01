import { type t, c, Cli, SlugLintFacets as Facets, Obj, Slug } from './common.ts';

import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import {
  type SlugLintProfilePick,
  selectSlugLintProfile,
  selectSlugLintProfileAction,
} from './u.lint.menu.ts';
import { lintSequenceFilepaths } from './u.lint.seq.files.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';
import { printSummary } from './u.lint.print.ts';
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

  const hasFileVideo = facets.includes('media:seq:file:video');
  const hasFileImage = facets.includes('media:seq:file:image');

  const spinner = Cli.spinner();
  spinner.start();

  let mediaSeqYamlPath: t.ObjectPath | undefined = yamlPath;

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
   */
  if (hasFileVideo || hasFileImage) {
    spinner.text = Fmt.spinnerText('asset files...');
    for (const node of dag.nodes) {
      const id = node.id;
      const baseResult = await lintSequenceFilepaths(dag, mediaSeqYamlPath, node.id, { facets });
      pushIssuesForDoc(id, baseResult);
    }
  }

  /**
   * Lint sequence data-structure shape.
   */
  if (facets.includes('media:seq:schema')) {
    for (const node of dag.nodes) {
      const id = node.id;
      const baseResult = await lintTypedYamlSequence(dag, mediaSeqYamlPath, node.id, {
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

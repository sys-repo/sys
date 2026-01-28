import {
  type t,
  c,
  Cli,
  LintDocFacets as Facets,
  Fs,
  Json,
  Obj,
  Pkg,
  pkg,
  Slug,
  Str,
} from './common.ts';

import { SlugTree } from '../slug.SlugTree/mod.ts';
import { Fmt } from './u.fmt.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { runLintCommand } from './u.lint.cmd.ts';
import {
  type SlugLintProfilePick,
  selectSlugLintProfile,
  selectSlugLintProfileAction,
} from './u.lint.menu.ts';
import { LintProfileSchema } from './u.lint.schema.ts';
import { bundleSequenceFilepaths } from './u.lint.seq.files.bundle.ts';
import { lintSequenceFilepaths } from './u.lint.seq.files.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';

type Issue = t.DocLintIssue;

/**
 * Lint namespace.
 */
export const Linter = {
  run,
  cmd: runLintCommand,
  Facets,
  Facet: { lintAliases, lintSequenceFilepaths, lintTypedYamlSequence },
} as const;

/**
 * Lint across the given DAG.
 */
async function run(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  opts: {
    facets?: string[];
    interactive?: boolean;
    cwd?: t.StringDir;
    createCrdt?: () => Promise<t.StringRef>;
  } = {},
): Promise<t.DocLintResult> {
  const { interactive = false } = opts;
  const issues: Issue[] = [];
  const Parse = Slug.parser(yamlPath);

  // Determine facets to lint on.
  let facets = (opts.facets ?? Facets) as t.DocLintFacet[];
  facets = facets.filter((facet) => Facets.includes(facet)); // Ensure facet exists in supported set.

  let profilePath: t.StringFile | undefined;

  if (opts.cwd && interactive) {
    let lastProfile: t.StringFile | undefined;
    profileLoop: while (true) {
      let actionPick: SlugLintProfilePick = await selectSlugLintProfile(opts.cwd, {
        interactive,
        defaultProfile: lastProfile,
      });

      if (actionPick.kind === 'exit') {
        return Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);
      }
      if ('profile' in actionPick && actionPick.profile) {
        lastProfile = actionPick.profile;
        profilePath = actionPick.profile;
        const doc = await readLintProfile(actionPick.profile);
        facets = resolveFacets({ current: facets, doc });
      }

      while (actionPick.kind === 'facets') {
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
        if (actionPick.profile) {
          const doc = await readLintProfile(actionPick.profile);
          await writeLintProfile(actionPick.profile, { ...doc, facets });
        }
        actionPick = await selectSlugLintProfileAction(opts.cwd, actionPick.profile, {
          defaultAction: 'facets',
        });
        if ('profile' in actionPick && actionPick.profile) {
          lastProfile = actionPick.profile;
          profilePath = actionPick.profile;
          const doc = await readLintProfile(actionPick.profile);
          facets = resolveFacets({ current: facets, doc });
        }
      }

      if (actionPick.kind === 'run') {
        break;
      }
      if (actionPick.kind === 'exit') {
        return Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);
      }
      if (actionPick.kind === 'back') {
        if ('profile' in actionPick && actionPick.profile) {
          lastProfile = actionPick.profile;
          profilePath = actionPick.profile;
        }
        continue profileLoop;
      }
    }
  } else if (opts.cwd) {
    const profilePick: SlugLintProfilePick = await selectSlugLintProfile(opts.cwd, {
      interactive,
    });
    if (profilePick.kind === 'exit') {
      return Obj.asGetter({ ok: true, facets: [], issues: [] }, ['issues']);
    }
    if ('profile' in profilePick && profilePick.profile) {
      profilePath = profilePick.profile;
      const doc = await readLintProfile(profilePick.profile);
      facets = resolveFacets({ current: facets, doc });
    }
  }

  const hasFileVideo = facets.includes('sequence:file:video');
  const hasFileImage = facets.includes('sequence:file:image');
  const hasFilesBundle = facets.includes('sequence:files:bundle');
  const hasSlugTree = facets.includes('fs:slug-tree');

  if (hasSlugTree && !opts.createCrdt) {
    const msg = 'warning: fs:slug-tree skipped (createCrdt not provided in Linter.run options)';
    console.info(c.yellow(msg));
    facets = facets.filter((facet) => facet !== 'fs:slug-tree');
  }
  if (hasSlugTree && !profilePath) {
    console.info(c.yellow('warning: fs:slug-tree skipped (no lint profile selected)'));
    facets = facets.filter((facet) => facet !== 'fs:slug-tree');
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
  if (facets.includes('fs:slug-tree') && profilePath && opts.cwd && opts.createCrdt) {
    await runSlugTreeFs({
      cwd: opts.cwd,
      profilePath,
      createCrdt: opts.createCrdt,
    });
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

async function readLintProfile(path: t.StringFile): Promise<t.LintProfileDoc> {
  const res = await Fs.readYaml<t.LintProfileDoc>(path);
  if (!res.ok || !res.exists) return LintProfileSchema.initial();
  const doc = res.data ?? {};
  return LintProfileSchema.validate(doc).ok ? doc : LintProfileSchema.initial();
}

async function writeLintProfile(path: t.StringFile, doc: t.LintProfileDoc) {
  await Fs.write(path, LintProfileSchema.stringify(doc));
}

function resolveFacets(args: {
  current: readonly t.DocLintFacet[];
  doc: t.LintProfileDoc;
}): t.DocLintFacet[] {
  const src = args.doc.facets ?? args.current;
  return src.filter((facet) => Facets.includes(facet));
}

async function runSlugTreeFs(args: {
  cwd: t.StringDir;
  profilePath: t.StringFile;
  createCrdt: () => Promise<t.StringRef>;
}) {
  const { cwd, profilePath, createCrdt } = args;
  const doc = await readLintProfile(profilePath);
  const config = doc['fs:slug-tree'];
  if (!config) {
    console.info(c.yellow('warning: fs:slug-tree skipped (missing config)'));
    return;
  }

  const source = Fs.Tilde.expand(String(config.source ?? '.'));
  const root = Fs.Path.resolve(cwd, source || '.');

  const targets = normalizeTargets(config.target).map((target) => ({
    raw: target,
    path: Fs.Path.resolve(cwd, Fs.Tilde.expand(String(target))),
  }));

  if (targets.length === 0) {
    console.info(c.yellow('warning: fs:slug-tree skipped (no target configured)'));
    return;
  }

  const tree = await SlugTree.fromDir(
    { root, createCrdt },
    {
      include: config.include ? [...config.include] : undefined,
      ignore: config.ignore ? [...config.ignore] : undefined,
      sort: config.sort,
      readmeAsIndex: config.readmeAsIndex,
    },
  );

  for (const target of targets) {
    const ext = Fs.extname(target.path).toLowerCase();
    const dir = Fs.dirname(target.path);
    await Fs.ensureDir(dir);
    if (ext === '.json') {
      await Fs.write(target.path, Json.stringify(tree));
      continue;
    }
    if (ext === '.yaml' || ext === '.yml') {
      await Fs.write(target.path, SlugTree.toYaml(tree));
      continue;
    }
    console.info(c.yellow(`warning: fs:slug-tree skipped unsupported target: ${target.raw}`));
  }
}

function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((value) => String(value).trim()).filter(Boolean) as t.StringPath[];
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

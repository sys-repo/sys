import { Workspace } from '@sys/workspace';
import { DenoFile } from '@sys/driver-deno/runtime';
import { type t, c, Cli, Path, Paths, R, Semver, Str } from './common.ts';
import { main as prepCi } from './task.prep.ci.ts';
import { main as prepCiDeno } from './task.prep.ci.deno.ts';
import { buildWorkspaceGraphCache, readWorkspaceGraphCache, writeWorkspaceGraphCache } from './task.prep.paths.ts';

type Options = {
  release?: t.SemverReleaseType;
  from?: string;
  dryRun?: boolean;
  nonInteractive?: boolean;
  argv?: string[];
};

type TArgs = {
  help?: boolean;
  from?: string;
  release?: t.SemverReleaseType;
  'dry-run'?: boolean;
  'non-interactive'?: boolean;
};

type Candidate = {
  readonly path: t.StringPath;
  readonly json: t.DenoFileJson;
  readonly name: string;
  readonly version: {
    readonly current: t.Semver;
    readonly next: t.Semver;
  };
};

export async function main(options: Options = {}) {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args, {
    boolean: ['help', 'dry-run', 'non-interactive'],
    alias: { h: ['help'] },
  });
  if (args.help) {
    wrangle.help();
    return false;
  }
  const release = wrangle.release(options, args);
  const dryRun = wrangle.dryRun(options, args);
  const nonInteractive = wrangle.nonInteractive(options, args);

  /**
   * Load the workspace.
   */
  const ws = await DenoFile.workspace();
  if (!ws.exists) {
    const err = `Could not find a workspace. Ensure the root deno.json file as a "workspace" configuration.`;
    console.warn(err);
    return;
  }

  const exclude = (path: t.StringPath) => {
    if (path.includes('deploy/@tdb.slc/')) return true;
    return false;
  };

  /**
   * Retrieve the child modules within the workspace.
   */
  const candidates = orderChildren(
    ws.children
    .filter((child) => !exclude(child.path.denofile))
    .filter((child) => !!child.denofile.version)
    .filter((child) => typeof child.denofile.version === 'string')
    .filter((child) => typeof child.denofile.name === 'string')
    .map((child) => {
      const json = child.denofile;
      const path = child.path.denofile;
      const { name = '', version = '' } = json;
      const current = Semver.parse(version).version;
      const next = wrangle.increment(current, release);
      return { path, json, name, version: { current, next } };
    }),
    Paths.all,
  );

  const selection = await wrangle.selection({
    from: wrangle.from(options, args),
    candidates,
    release,
  });
  const plan = await wrangle.runPlanningPhase(candidates, selection);
  const selected = plan.selected;
  const selectedPaths = new Set(selected.map((child) => packagePath(child)));

  // Prepare the set of next versions to bump to.
  const table = Cli.table(['Module', 'Current', '', 'Next']);
  candidates.forEach((child) => table.push(wrangle.preflightRow(child, selectedPaths, release)));

  if (!selection.nonInteractive) console.clear();
  console.info();
  if (plan.kind === 'selection') {
    console.info(c.gray(`Selected root: ${c.white(plan.root.name)}`));
    console.info(c.gray(`Affected packages: ${c.white(String(selected.length))}`));
    console.info();
  }
  console.info(c.gray(table.toString()));
  console.info();

  if (dryRun) {
    console.info(c.gray(c.italic('Dry run only. No files updated.')));
    console.info();
    return true;
  }

  /**
   * Prompt to continue.
   */
  const yes = nonInteractive ? true : await wrangle.confirm();
  if (!yes) return false;

  /**
   * Write version to files.
   */
  await wrangle.runSilentPhase('saving bumped package versions...', async () => {
    for (const child of selected) {
      const denofile = R.clone(child.json) as t.DenoFileJson;
      denofile.version = Semver.toString(child.version.next);
      const json = `${JSON.stringify(denofile, null, '  ')}\n`;
      await Deno.writeTextFile(child.path, json);
    }
  });

  console.info(Cli.Fmt.spinnerText('running workspace prep...'));
  const prepare = await import('./task.prep.ts');
  const prepared = await prepare.main('bump', { orderedPaths: candidates.map((child) => packagePath(child)) });
  await prepCiDeno();
  await prepCi({ prepared, final: true, sourcePaths: selected.map((child) => packagePath(child)) });

  return true;
} 

export function orderChildren<T extends { path: t.StringPath }>(
  children: readonly T[],
  orderedPaths: readonly t.StringPath[],
) {
  const childByPath = new Map(children.map((child) => [Path.dirname(child.path), child] as const));
  const ordered = orderedPaths.flatMap((path) => {
    const child = childByPath.get(path);
    return child ? [child] : [];
  });

  const seen = new Set(ordered.map((child) => Path.dirname(child.path)));
  const remainder = children
    .filter((child) => !seen.has(Path.dirname(child.path)))
    .toSorted((a, b) => Path.dirname(a.path).localeCompare(Path.dirname(b.path)));

  return [...ordered, ...remainder];
}

/**
 * Helpers
 */
const wrangle = {
  release(options: Options, argv: TArgs): t.SemverReleaseType {
    if (options.release !== undefined) return options.release;

    if (argv.release !== undefined) {
      const release = argv.release.toLowerCase() as t.SemverReleaseType;
      const supported: t.SemverReleaseType[] = ['major', 'minor', 'patch'];
      if (supported.includes(release)) return release;

      // Unsupported semver release/bump type.
      const argValue = c.white(c.bold(release));
      const title = c.bold('Warning');
      const msg = `--release="${argValue}" argument not supported.`;
      const warning = c.yellow(`${title}: ${msg}`);
      console.warn(warning);
    }

    return 'patch'; // (Default).
  },

  help() {
    Cli.Fmt.Help.render({
      tool: 'deno task bump',
      summary: 'Bump workspace packages from a selected topological root and regenerate derived surfaces.',
      note: 'Interactive by default; `--from` supports scripted selective bumps.',
      usage: [
        'deno task bump',
        'deno task bump -- --release minor',
        'deno task bump -- --from=@sys/esm --non-interactive --dry-run',
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--release <patch|minor|major>', 'choose the semver bump kind (default: patch)'],
        ['--from <package-name|package-path>', 'select the bump root without an interactive picker'],
        ['--dry-run', 'render the plan without writing files'],
        ['--non-interactive', 'skip interactive confirmation once a root is known'],
      ],
    });
  },

  dryRun(options: Options, argv: TArgs) {
    return options.dryRun ?? argv['dry-run'] ?? false;
  },

  from(options: Options, argv: TArgs) {
    return options.from ?? argv.from;
  },

  nonInteractive(options: Options, argv: TArgs) {
    return options.nonInteractive ?? argv['non-interactive'] ?? false;
  },

  async selection(args: {
    from?: string;
    candidates: readonly Candidate[];
    release: t.SemverReleaseType;
  }): Promise<
    | { readonly nonInteractive: true; readonly value: t.StringPath }
    | { readonly nonInteractive: false; readonly value: t.StringPath }
  > {
    if (args.from) {
      const value = wrangle.resolveFrom(args.candidates, args.from);
      if (!value) throw new Error(`Unknown bump root: ${args.from}`);
      return { nonInteractive: true, value };
    }

    const layout = wrangle.selectionLayout(args.candidates);
    const options = args.candidates.map((candidate) => ({
      name: wrangle.selectionLabel(candidate, layout, args.release),
      value: packagePath(candidate),
    }));
    const total = args.candidates.length.toLocaleString();

    const picked = await Cli.Input.Select.prompt<t.StringPath>({
      message: `${c.cyan('›')} which package should start the ${c.cyan(args.release)} bump ${c.gray(`(${total} total)`)}:\n`,
      maxRows: Math.min(50, args.candidates.length),
      options,
      default: packagePath(args.candidates[0]),
      hideDefault: true,
    });

    return { nonInteractive: false, value: picked };
  },

  selectionLayout(candidates: readonly Candidate[]) {
    return candidates.reduce(
      (acc, candidate) => ({
        name: Math.max(acc.name, candidate.name.length),
        version: Math.max(acc.version, Semver.toString(candidate.version.current).length),
      }),
      { name: 0, version: 0 },
    );
  },

  selectionLabel(
    candidate: Candidate,
    layout: { readonly name: number; readonly version: number },
    release: t.SemverReleaseType,
  ) {
    const path = c.gray(packagePath(candidate));
    const name = wrangle.pad(candidate.name, layout.name);
    const current = wrangle.pad(Semver.Fmt.colorize(candidate.version.current, { highlight: release }), layout.version);
    return `${c.cyan('•')} ${c.white(c.bold(name))}  ${current}  ${path}`;
  },

  resolveFrom(candidates: readonly Candidate[], input: string) {
    const trimmed = input.trim();
    const exactPath = candidates.find((candidate) => packagePath(candidate) === trimmed);
    if (exactPath) return packagePath(exactPath);
    const exactName = candidates.find((candidate) => candidate.name === trimmed);
    if (exactName) return packagePath(exactName);
    return undefined;
  },

  async plan(
    candidates: readonly Candidate[],
    selection: { readonly value: t.StringPath },
    packages: { readonly edges: readonly { readonly from: t.StringPath; readonly to: t.StringPath }[] },
  ) {
    const root = candidates.find((candidate) => packagePath(candidate) === selection.value);
    if (!root) throw new Error(`Unknown bump root: ${selection.value}`);

    const selectedPaths = new Set<string>(wrangle.dependentClosure(selection.value, packages.edges));
    const selected = candidates.filter((candidate) => selectedPaths.has(packagePath(candidate)));
    return { kind: 'selection', root, selected } as const;
  },

  preflightRow(
    candidate: Candidate,
    selectedPaths: ReadonlySet<string>,
    release: t.SemverReleaseType,
  ) {
    const affected = selectedPaths.has(packagePath(candidate));
    const { name, version } = candidate;
    const modParts = name.split('/');
    const modScope = modParts[0];
    const modName = modParts.splice(1).join('/');
    const pkg = affected
      ? `${c.gray(modScope)}/${c.white(c.bold(modName))}`
      : c.gray(`${modScope}/${modName}`);

    const bullet = affected ? c.cyan(' •') : c.gray(c.dim(' •'));
    const current = affected ? c.gray(Semver.toString(version.current)) : c.gray(c.dim(Semver.toString(version.current)));
    const arrow = affected ? '→' : c.gray(c.dim('→'));
    const next = affected
      ? Semver.Fmt.colorize(version.next, { highlight: release })
      : c.gray(c.dim(Semver.toString(version.next)));

    return [`${bullet} ${pkg}`, current, arrow, next];
  },

  dependentClosure(root: t.StringPath, edges: readonly { readonly from: t.StringPath; readonly to: t.StringPath }[]) {
    const queue = [root];
    const seen = new Set<t.StringPath>(queue);

    while (queue.length > 0) {
      const next = queue.shift()!;
      for (const edge of edges) {
        if (edge.from !== next || seen.has(edge.to)) continue;
        seen.add(edge.to);
        queue.push(edge.to);
      }
    }

    return Paths.all.filter((path) => seen.has(path));
  },

  async confirm() {
    const answer = await Cli.Input.Select.prompt<'save' | 'cancel'>({
      message: 'Apply update plan:\n',
      options: [
        { name: c.green(c.bold('Save')), value: 'save' },
        { name: c.gray('Cancel'), value: 'cancel' },
      ],
      default: 'save',
      hideDefault: true,
    });
    return answer === 'save';
  },

  async runSilentPhase<T>(label: string, fn: () => Promise<T>) {
    const spinner = Cli.Spinner.create('');
    console.info();
    spinner.start(Cli.Fmt.spinnerText(label));
    try {
      return await fn();
    } finally {
      spinner.stop();
    }
  },

  async runPlanningPhase(
    candidates: readonly Candidate[],
    selection: { readonly value: t.StringPath },
  ) {
    const spinner = Cli.Spinner.create('');
    console.info();
    spinner.start(Cli.Fmt.spinnerText('loading workspace dependency cache...'));
    try {
      let cache: Awaited<ReturnType<typeof readWorkspaceGraphCache>> = await readWorkspaceGraphCache();
      if (!cache) {
        spinner.text = Cli.Fmt.spinnerText('loading workspace dependency graph...');
        cache = await buildWorkspaceGraphCache(Deno.cwd());
        spinner.text = Cli.Fmt.spinnerText('saving workspace dependency cache...');
        await writeWorkspaceGraphCache(cache);
      }
      if (!cache) throw new Error('Failed to load workspace dependency cache');

      spinner.text = Cli.Fmt.spinnerText('deriving affected downstream packages (topological)...');
      return await wrangle.plan(candidates, selection, { edges: cache.edges });
    } finally {
      spinner.stop();
    }
  },

  increment(current: t.Semver, release: t.SemverReleaseType) {
    const isPrerelease = (current.prerelease ?? []).length > 0;
    if (release === 'patch' && isPrerelease) release = 'prerelease';
    return Semver.increment(current, release);
  },

  pad(value: string, width: number) {
    const visible = Cli.stripAnsi(value).length;
    return visible >= width ? value : `${value}${' '.repeat(width - visible)}`;
  },
} as const;

function packagePath(input: { path: t.StringPath }) {
  return Path.dirname(input.path);
}

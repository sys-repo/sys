import { Cli, c } from '@sys/cli';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Fs, Path } from '@sys/fs';
import { Process } from '@sys/process';
import { type t } from './common.ts';

type Options = {
  build?: boolean;
  exitOnError?: boolean;
  /** per-package spinner (used only in sequential mode) */
  spinner?: boolean;
};

type BuildAndCopyAllOptions = {
  /** number of parallel builds; 1 = sequential */
  concurrency?: number;
};

/**
 * Bounded concurrency helper (stable order).
 */
async function runWithConcurrency<T>(
  tasks: readonly (() => Promise<T>)[],
  limit: number,
): Promise<readonly T[]> {
  const results: T[] = [];
  let i = 0;
  const pool: Promise<void>[] = [];

  const runNext = async () => {
    const idx = i++;
    if (idx >= tasks.length) return;
    const res = await tasks[idx]();
    results[idx] = res;
    await runNext();
  };

  const n = Math.max(1, Math.floor(limit));
  for (let k = 0; k < Math.min(n, tasks.length); k++) pool.push(runNext());
  await Promise.all(pool);
  return results;
}

/**
 * Spinner plumbing (no classes).
 */
type SpinnerLike = { stop: () => void; update?: (s: string) => void; text?: string };
function makePanel(initial: string) {
  let memo = initial;
  let spin: SpinnerLike = Cli.spinner(initial) as unknown as SpinnerLike;
  const set = (text: string) => {
    memo = text;
    if (spin.update) spin.update(text);
    else spin.text = text;
  };
  const logBelow = (line: string) => {
    const snapshot = memo;
    spin.stop();
    if (line !== undefined) console.info(line);
    spin = Cli.spinner(snapshot) as unknown as SpinnerLike;
  };
  const stop = () => spin.stop();
  return {
    set,
    logBelow,
    stop,
    get text() {
      return memo;
    },
  };
}

export async function buildAndCopyAll(
  all: readonly Parameters<typeof buildAndCopy>[],
  allOptions: BuildAndCopyAllOptions = {},
) {
  // Table (unchanged UX)
  const table = Cli.table([]);
  table.push([c.gray('packages:')]);
  table.push([c.gray('  │ ')]);

  type Status = 'pending' | 'active' | 'ok' | 'fail';
  type Item = {
    moduleDir: t.StringDir;
    targetDir: t.StringRelativeDir;
    options: Options;
    pkgName: string;
    status: Status;
    tree: string; // gray tree connector prefix: "  ├── " / "  └── "
  };

  const items: Item[] = [];
  let i = -1;
  for (const [moduleDir, targetDir, options] of all) {
    i++;
    const isLast = i === all.length - 1;
    const tree = isLast ? '  └──' : '  ├──';

    const denofile = (await DenoFile.load(moduleDir)).data;
    const pkgName = denofile?.name ?? '<unnamed>';
    const pkgLabel = c.green(pkgName);
    const input = `${c.gray(tree)} ${c.gray(moduleDir)}`;
    const out = c.cyan(targetDir);

    table.push([input, out]);
    items.push({
      moduleDir,
      targetDir,
      options: { ...(options ?? {}), spinner: options?.spinner ?? true },
      pkgName,
      status: 'pending',
      tree,
    });
  }

  console.info(table.toString().trim());
  console.info();

  const concurrency = Math.max(1, Math.floor(allOptions.concurrency ?? 1));

  if (concurrency === 1) {
    // Sequential: keep original per-package spinner semantics.
    for (const it of items) {
      await buildAndCopy(it.moduleDir, it.targetDir, it.options);
    }
    return;
  }

  // Parallel: single live-updating panel that lists ALL packages with status.
  const wantExitOnError = items.some((it) => it.options.exitOnError);
  const total = items.length;

  // Longest package name for column alignment (right of the tree).
  const maxNameLen = items.reduce((m, it) => Math.max(m, it.pkgName.length), 0);
  const padName = (name: string) => ' '.repeat(Math.max(0, maxNameLen - name.length));

  const headerText = () => {
    const active = items.filter((x) => x.status === 'active').length;
    const building = c.cyan('building: ');
    return building + c.white(`${active}/${total}`) + c.gray(' in progress');
  };

  // Right-column formatter (arrow + path with independent colors).
  const rightColumn = (
    dir: string,
    arrow: 'white' | 'cyan' | 'gray' | 'red' = 'white',
    path: 'cyan' | 'gray' | 'white' | 'red' = 'cyan',
  ) => {
    const arrowStr =
      arrow === 'cyan'
        ? c.cyan('→')
        : arrow === 'gray'
          ? c.gray('→')
          : arrow === 'red'
            ? c.red('→')
            : c.white('→');
    const pathStr =
      path === 'gray'
        ? c.gray(`/${dir}`)
        : path === 'white'
          ? `/${dir}`
          : path === 'red'
            ? c.red(`/${dir}`)
            : c.cyan(`/${dir}`);
    return `${arrowStr}  ${pathStr}`;
  };

  const lineFor = (it: Item) => {
    const namePad = padName(it.pkgName);
    const prefix = c.gray(it.tree); // left tree

    switch (it.status) {
      case 'ok': {
        const name = c.green(it.pkgName) + namePad;
        return `${prefix} ${c.green('✓')} ${name}  ${rightColumn(it.targetDir, 'white', 'cyan')}`;
      }
      case 'active': {
        const name = c.gray(it.pkgName) + namePad;
        return `${prefix} ${c.white('•')} ${name}  ${rightColumn(it.targetDir, 'gray', 'gray')}`;
      }
      case 'fail': {
        const name = c.red(it.pkgName) + namePad;
        return `${prefix} ${c.red('✗')} ${name}  ${rightColumn(it.targetDir, 'white', 'cyan')}`;
      }
      case 'pending':
      default: {
        const name = `${it.pkgName}${namePad}`;
        return `${prefix} ${c.gray(c.dim(`• ${name}  →  /${it.targetDir}`))}`;
      }
    }
  };

  const composePanel = () => `${headerText()}\n${items.map(lineFor).join('\n')}\n`;

  const panel = makePanel(composePanel());

  const setStatus = (idx: number, status: Item['status']) => {
    items[idx].status = status;
    panel.set(composePanel());
  };

  const tasks = items.map((it, idx) => {
    return async () => {
      setStatus(idx, 'active');

      const res = await buildAndCopy(it.moduleDir, it.targetDir, {
        ...it.options,
        spinner: false, //     ← no per-task spinners in parallel mode
        exitOnError: false, // ← defer process exit decision
      });

      if (res.ok) setStatus(idx, 'ok');
      else {
        setStatus(idx, 'fail');
        if (res.stderr) {
          panel.logBelow('');
          panel.logBelow(res.stderr);
          panel.set(composePanel()); // repaint panel after error log
        }
      }

      return res.ok;
    };
  });

  const results = await runWithConcurrency(tasks, concurrency);
  panel.stop();

  const anyFailed = results.some((ok) => !ok);
  if (anyFailed && wantExitOnError) Deno.exit(1);
}

/**
 * Build project(s).
 */
export async function buildAndCopy(
  moduleDir: t.StringDir,
  targetDir: t.StringRelativeDir,
  options: Options = {},
) {
  const { exitOnError = true, spinner = true } = options;
  const path = Fs.resolve(moduleDir);
  const silent = true;
  const sh = Process.sh({ path, silent });

  const denofile = (await DenoFile.load(path)).data;
  if (!denofile) throw new Error(`Failed to load deno.json from: ${path}`);

  // Build:
  let stderr: string | undefined;

  if (options.build ?? true) {
    const pkg: t.Pkg = { name: denofile.name ?? 'Unnamed', version: denofile.version ?? '0.0.0' };
    const label =
      c.gray('building: ') + c.green(pkg.name) + ' ' + c.white('→') + ' ' + c.cyan(`/${targetDir}`);

    const spin = spinner ? Cli.spinner(label + '\n') : undefined;
    const res = await sh.run('deno -q task test && deno -q task build');
    spin?.stop();

    if (!res.success) {
      stderr = res.text.stderr;
      if (spinner) {
        console.info(stderr);
        console.info();
        console.info(c.yellow('─'.repeat(21)));
        console.error(`${c.red(c.bold('Failed'))} while building ${c.yellow(pkg.name)}\n`);
      }
      if (exitOnError) Deno.exit(1);
    }
  }

  // Copy build to local /dist.
  const dir = {
    src: Path.join(path, 'dist'),
    target: targetDir,
  };
  await Fs.copy(dir.src, Path.resolve('dist', dir.target), { force: true });

  // Finish up.
  return {
    ok: !stderr,
    dir,
    stderr,
  } as const;
}

/**
 * Copy in the `public/static` assets to the dist folder.
 */
export async function copyPublic(sourceDir: t.StringDir, targetDir: t.StringRelativeDir) {
  const glob = Fs.glob(sourceDir);
  const dirs = await glob.find('*/');
  for (const dir of dirs) {
    await Fs.copy(dir.path, Fs.join(targetDir, dir.name), { force: true });
  }
}

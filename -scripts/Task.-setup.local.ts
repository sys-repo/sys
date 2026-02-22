import { Fs, c } from './common.ts';

type TLink = {
  readonly name: string;
  readonly source: string;
  readonly target: string;
  readonly optional?: boolean;
};

/**
 * Local machine setup (opt-in):
 * - symlink Codex skills surfaces into the active `/sys` repo root
 * - add local-only ignore entries into `.git/info/exclude`
 */
export async function main() {
  const links = [
    {
      name: 'Codex skills',
      source: '../-config/-canon.skills-refactor/.agents/skills',
      target: '.agents/skills',
    },
    {
      name: 'Codex metadata',
      source: '../-config/-canon.skills-refactor/agents/openai.yaml',
      target: 'agents/openai.yaml',
      optional: true,
    },
  ] as const satisfies readonly TLink[];

  console.info();
  console.info(c.brightWhite(c.bold('Local Setup')));
  console.info(c.gray(' Configure local symlinks for Codex skills discovery.'));
  console.info();

  for (const link of links) {
    await ensureLink(link);
  }

  await ensureGitExclude([
    '.agents/',
    'agents/openai.yaml',
  ]);

  console.info();
  console.info(c.green('Local setup complete.'));
  console.info();
}

async function ensureLink(link: TLink) {
  const srcExists = await Fs.exists(link.source);
  if (!srcExists) {
    const msg = `${fmtLabel(link.name)} ${c.yellow('source missing:')} ${c.gray(link.source)}`;
    if (link.optional) {
      console.info(msg, c.dim('(skipped)'));
      return;
    }
    throw new Error(`${link.name} source does not exist: ${link.source}`);
  }

  const targetInfo = await lstatSafe(link.target);
  if (!targetInfo) {
    await Fs.ensureDir(Fs.dirname(link.target));
    await Fs.ensureSymlink(link.source, link.target);
    console.info(
      `${fmtLabel(link.name)} ${c.green('linked')}`,
      c.gray(link.target),
      c.dim('->'),
      c.gray(link.source),
    );
    return;
  }

  if (!targetInfo.isSymlink) {
    throw new Error(
      `${link.name} target exists and is not a symlink: ${link.target}. Remove it manually or choose a different local setup path.`,
    );
  }

  const ok = await symlinkPointsTo(link.target, link.source);
  if (!ok) {
    const current = await Deno.readLink(link.target).catch(() => '<unreadable>');
    throw new Error(
      `${link.name} symlink points to a different target. Existing: ${link.target} -> ${current}. Expected -> ${link.source}`,
    );
  }

  console.info(
    `${fmtLabel(link.name)} ${c.dim(c.green('ok'))}`,
    c.gray(link.target),
    c.dim('(already linked)'),
  );
}

async function symlinkPointsTo(targetPath: string, expectedSourcePath: string) {
  const current = await Deno.readLink(targetPath);
  const currentAbs = Fs.resolve(Fs.dirname(targetPath), current);
  const expectedAbs = Fs.resolve(expectedSourcePath);

  try {
    const [a, b] = await Promise.all([
      Fs.realPath(currentAbs),
      Fs.realPath(expectedAbs),
    ]);
    return a === b;
  } catch {
    // Fallback to normalized absolute path comparison when realpath fails.
    return currentAbs === expectedAbs;
  }
}

async function lstatSafe(path: string) {
  try {
    return await Deno.lstat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

async function ensureGitExclude(entries: readonly string[]) {
  const excludePath = await resolveGitExcludePath();
  if (!excludePath) {
    console.info(c.yellow('Warning:'), c.gray('could not resolve .git/info/exclude (skipped local ignore setup)'));
    return;
  }

  await Fs.ensureDir(Fs.dirname(excludePath));
  const file = (await Fs.readText(excludePath)).data ?? '';

  const marker = '# setup-local (codex skills symlink)';
  const lines = file.split('\n');
  const next = [...lines];
  let changed = false;

  if (!file.includes(marker)) {
    if (next.length && next[next.length - 1] !== '') next.push('');
    next.push(marker);
    changed = true;
  }

  for (const item of entries) {
    if (!file.split('\n').includes(item) && !next.includes(item)) {
      next.push(item);
      changed = true;
    }
  }

  if (!changed) {
    console.info(`${fmtLabel('git exclude')} ${c.dim(c.green('ok'))}`, c.gray(excludePath), c.dim('(already configured)'));
    return;
  }

  const text = `${next.join('\n').replace(/\n*$/, '\n')}`;
  await Fs.write(excludePath, text, { force: true });
  console.info(`${fmtLabel('git exclude')} ${c.green('updated')}`, c.gray(excludePath));
}

async function resolveGitExcludePath() {
  const git = '.git';
  const info = await lstatSafe(git);
  if (!info) return undefined;

  if (info.isDirectory) return Fs.join(git, 'info', 'exclude');

  if (info.isFile) {
    const text = (await Fs.readText(git)).data ?? '';
    const m = text.match(/^gitdir:\s*(.+)\s*$/m);
    if (!m) return undefined;
    const gitDir = Fs.resolve(m[1]);
    return Fs.join(gitDir, 'info', 'exclude');
  }

  return undefined;
}

function fmtLabel(name: string) {
  return c.bold(c.cyan(`[setup-local:${name}]`));
}


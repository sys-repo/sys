import { Process, type t } from './common.ts';

type Path = t.StringPath;

export type CopyPlan = {
  /** New files (untracked OR added in index). */
  readonly add: readonly Path[];

  /** Modified tracked files (staged and/or unstaged). */
  readonly modify: readonly Path[];

  /** Removed files (deleted in index and/or working tree). */
  readonly remove: readonly Path[];

  /** Renames are first-class for clarity. */
  readonly rename: readonly { readonly from: Path; readonly to: Path }[];

  /** Conflicts / unmerged paths: visible and flagged. */
  readonly conflict: readonly Path[];

  /** Submodules: visible and flagged (if detected). */
  readonly submodule: readonly Path[];
};

export type CopyPlanRunResult =
  | { readonly ok: true; readonly plan: CopyPlan }
  | { readonly ok: false; readonly reason: string; readonly error?: unknown };

const GIT_STATUS_ARGS = [
  'status',
  '--porcelain=v2',
  '-z',
  '--untracked-files=all',
  '--find-renames',
];

export async function deriveCopyPlan(repoRootAbs: t.StringDir): Promise<CopyPlanRunResult> {
  let output: string;

  try {
    const res = await Process.invoke({
      cmd: 'git',
      args: GIT_STATUS_ARGS,
      cwd: repoRootAbs,
      silent: true,
    });

    if (!res.success) {
      const failure = res.text.stderr || res.text.stdout || res.toString();
      const normalized = typeof failure === 'string' ? failure.toLowerCase() : '';
      if (normalized.includes('not a git repository')) {
        return { ok: false, reason: 'not-a-repo', error: failure };
      }
      return { ok: false, reason: 'spawn-failed', error: failure };
    }

    output = res.text.stdout || res.text.stderr || '';
  } catch (error) {
    return { ok: false, reason: 'spawn-failed', error };
  }

  return { ok: true, plan: parseStatus(output) };
}

function parseStatus(output: string): CopyPlan {
  const builder = new PlanBuilder();
  const entries = output.split('\0');
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;

    const marker = entry[0];
    switch (marker) {
      case '#':
        continue; // header metadata
      case '1':
        parseOrdinary(entry, builder);
        break;
      case '2': {
        const origin = entries[++index];
        parseRename(entry, origin, builder);
        break;
      }
      case 'u':
        parseConflict(entry, builder);
        break;
      case '?':
        parseUntracked(entry, builder);
        break;
      case '!':
        continue; // ignored
      default:
        continue;
    }
  }

  return builder.build();
}

function parseOrdinary(entry: string, builder: PlanBuilder) {
  const tokens = entry.split(' ');
  if (tokens.length < 9) return;

  const path = tokens.slice(8).join(' ').trim();
  if (!path) return;

  builder.track(path, tokens[1]);
  builder.maybeMarkSubmodule(path, tokens[2], tokens.slice(3, 6));
}

function parseConflict(entry: string, builder: PlanBuilder) {
  const tokens = entry.split(' ');
  if (tokens.length < 9) return;

  const path = tokens.slice(8).join(' ').trim();
  if (!path) return;

  builder.markConflict(path);
  builder.maybeMarkSubmodule(path, tokens[2], tokens.slice(3, 6));
}

function parseRename(entry: string, originEntry: string | undefined, builder: PlanBuilder) {
  if (!originEntry) return;
  const tokens = entry.split(' ');
  if (tokens.length < 10) return;

  const target = tokens.slice(9).join(' ').trim();
  const origin = originEntry.trim();
  if (!target || !origin) return;

  builder.maybeMarkSubmodule(target, tokens[2], tokens.slice(3, 6));

  const scoreToken = tokens[8] ?? '';
  if (scoreToken.startsWith('C')) {
    builder.markAdd(target);
    return;
  }

  builder.recordRename(origin, target);
}

function parseUntracked(entry: string, builder: PlanBuilder) {
  const path = entry.slice(2).trim();
  if (!path) return;
  builder.markAdd(path);
}

class PlanBuilder {
  private readonly add = new Set<Path>();
  private readonly modify = new Set<Path>();
  private readonly remove = new Set<Path>();
  private readonly renameTargets = new Set<Path>();
  private readonly renameSources = new Set<Path>();
  private readonly conflict = new Set<Path>();
  private readonly submodule = new Set<Path>();
  private readonly renameEntries: { readonly from: Path; readonly to: Path }[] = [];

  markAdd(path: Path) {
    if (this.isLocked(path)) return;
    this.remove.delete(path);
    this.modify.delete(path);
    this.add.add(path);
  }

  markModify(path: Path) {
    if (this.isLocked(path)) return;
    if (this.add.has(path)) return;
    this.remove.delete(path);
    this.modify.add(path);
  }

  markRemove(path: Path) {
    if (this.submodule.has(path)) return;
    if (this.renameSources.has(path)) return;
    this.add.delete(path);
    this.modify.delete(path);
    this.remove.add(path);
  }

  markConflict(path: Path) {
    this.cleanup(path);
    this.conflict.add(path);
  }

  markSubmodule(path: Path) {
    this.cleanup(path);
    this.submodule.add(path);
  }

  recordRename(from: Path, to: Path) {
    if (!from || !to) return;
    this.cleanup(to);
    this.remove.delete(from);
    this.renameTargets.add(to);
    this.renameSources.add(from);
    this.renameEntries.push({ from, to });
  }

  maybeMarkSubmodule(path: Path, sub: string, modes: readonly string[]) {
    if (this.submodule.has(path)) return;
    if (sub?.startsWith('S')) {
      this.markSubmodule(path);
      return;
    }
    if (modes.some((mode) => mode === '160000')) {
      this.markSubmodule(path);
    }
  }

  track(path: Path, xy: string) {
    const [x = '.', y = '.'] = xy.split('');

    if (x === 'A') {
      this.markAdd(path);
    } else if (x === 'D') {
      this.markRemove(path);
    } else if (x !== '.' && x !== ' ') {
      this.markModify(path);
    }

    if (y === 'D') {
      this.markRemove(path);
    } else if (y !== '.' && y !== ' ') {
      this.markModify(path);
    }
  }

  build(): CopyPlan {
    for (const target of this.renameTargets) {
      this.add.delete(target);
      this.modify.delete(target);
    }
    for (const source of this.renameSources) {
      this.remove.delete(source);
    }

    return {
      add: sort([...this.add]),
      modify: sort([...this.modify]),
      remove: sort([...this.remove]),
      rename: sortRenames(this.renameEntries),
      conflict: sort([...this.conflict]),
      submodule: sort([...this.submodule]),
    };
  }

  private cleanup(path: Path) {
    this.add.delete(path);
    this.modify.delete(path);
    this.remove.delete(path);
    this.conflict.delete(path);
  }

  private isLocked(path: Path) {
    return this.submodule.has(path) || this.conflict.has(path) || this.renameTargets.has(path);
  }
}

const sort = (items: Path[]) => items.sort((a, b) => a.localeCompare(b));

const sortRenames = (entries: { readonly from: Path; readonly to: Path }[]) =>
  entries.slice().sort((a, b) => {
    const cmp = a.from.localeCompare(b.from);
    return cmp === 0 ? a.to.localeCompare(b.to) : cmp;
  });

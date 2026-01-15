import { Git } from 'jsr:@sys/driver-process/git';
import { type t } from './common.ts';
import type { CopyPlanRunResult } from './t.copyPlan.ts';

type Path = t.StringPath;

export async function deriveCopyPlan(repoRootAbs: t.StringDir): Promise<CopyPlanRunResult> {
  const statusResult = await Git.statusPorcelainV2Z({
    cwd: repoRootAbs,
    untracked: true,
    findRenames: true,
  });

  if (!statusResult.ok) {
    const reason = statusResult.reason === 'not-a-repo' ? 'not-a-repo' : 'spawn-failed';
    return { ok: false, reason, error: statusResult.error };
  }

  return { ok: true, plan: parseStatus(statusResult.stdout) };
}

function parseStatus(output: string): t.CopyPlan {
  const acc = PlanAcc.init();
  const entries = output.split('\0');
  for (let cursor = 0; cursor < entries.length; cursor += 1) {
    const entry = entries[cursor];
    if (!entry) continue;

    const marker = entry[0];
    switch (marker) {
      case '#':
        continue; // header metadata
      case '1':
        parseOrdinary(entry, acc);
        break;
      case '2': {
        const origin = entries[++cursor];
        parseRename(entry, origin, acc);
        break;
      }
      case 'u':
        parseConflict(entry, acc);
        break;
      case '?':
        parseUntracked(entry, acc);
        break;
      case '!':
        continue; // ignored
      default:
        continue;
    }
  }

  return PlanAcc.build(acc);
}

function parseOrdinary(entry: string, acc: PlanAcc) {
  const tokens = entry.split(' ');
  if (tokens.length < 9) return;

  const path = tokens.slice(8).join(' ').trim();
  if (!path) return;

  PlanAcc.track(acc, path, tokens[1]);
  PlanAcc.maybeMarkSubmodule(acc, path, tokens[2], tokens.slice(3, 6));
}

function parseConflict(entry: string, acc: PlanAcc) {
  const tokens = entry.split(' ');
  if (tokens.length < 9) return;

  const path = tokens.slice(8).join(' ').trim();
  if (!path) return;

  PlanAcc.markConflict(acc, path);
  PlanAcc.maybeMarkSubmodule(acc, path, tokens[2], tokens.slice(3, 6));
}

function parseRename(entry: string, originEntry: string | undefined, acc: PlanAcc) {
  if (!originEntry) return;
  const tokens = entry.split(' ');
  if (tokens.length < 10) return;

  const target = tokens.slice(9).join(' ').trim();
  const origin = originEntry.trim();
  if (!target || !origin) return;

  PlanAcc.maybeMarkSubmodule(acc, target, tokens[2], tokens.slice(3, 6));

  const scoreToken = tokens[8] ?? '';
  if (scoreToken.startsWith('C')) {
    PlanAcc.markAdd(acc, target);
    return;
  }

  PlanAcc.recordRename(acc, origin, target);
}

function parseUntracked(entry: string, acc: PlanAcc) {
  const path = entry.slice(2).trim();
  if (!path) return;
  PlanAcc.markAdd(acc, path);
}

type RenameEntry = { readonly from: Path; readonly to: Path };

type PlanAcc = {
  readonly add: Set<Path>;
  readonly modify: Set<Path>;
  readonly remove: Set<Path>;
  readonly renameTargets: Set<Path>;
  readonly renameSources: Set<Path>;
  readonly conflict: Set<Path>;
  readonly submodule: Set<Path>;
  readonly renameEntries: RenameEntry[];
};

const PlanAcc = {
  init(): PlanAcc {
    return {
      add: new Set(),
      modify: new Set(),
      remove: new Set(),
      renameTargets: new Set(),
      renameSources: new Set(),
      conflict: new Set(),
      submodule: new Set(),
      renameEntries: [],
    };
  },
  cleanup(acc: PlanAcc, path: Path) {
    acc.add.delete(path);
    acc.modify.delete(path);
    acc.remove.delete(path);
    acc.conflict.delete(path);
  },
  isLocked(acc: PlanAcc, path: Path) {
    return acc.submodule.has(path) || acc.conflict.has(path) || acc.renameTargets.has(path);
  },
  markAdd(acc: PlanAcc, path: Path) {
    if (this.isLocked(acc, path)) return;
    acc.remove.delete(path);
    acc.modify.delete(path);
    acc.add.add(path);
  },
  markModify(acc: PlanAcc, path: Path) {
    if (this.isLocked(acc, path)) return;
    if (acc.add.has(path)) return;
    acc.remove.delete(path);
    acc.modify.add(path);
  },
  markRemove(acc: PlanAcc, path: Path) {
    if (acc.submodule.has(path)) return;
    if (acc.renameSources.has(path)) return;
    acc.add.delete(path);
    acc.modify.delete(path);
    acc.remove.add(path);
  },
  markConflict(acc: PlanAcc, path: Path) {
    this.cleanup(acc, path);
    acc.conflict.add(path);
  },
  markSubmodule(acc: PlanAcc, path: Path) {
    this.cleanup(acc, path);
    acc.submodule.add(path);
  },
  recordRename(acc: PlanAcc, from: Path, to: Path) {
    if (!from || !to) return;
    this.cleanup(acc, to);
    acc.remove.delete(from);
    acc.renameTargets.add(to);
    acc.renameSources.add(from);
    acc.renameEntries.push({ from, to });
  },
  maybeMarkSubmodule(acc: PlanAcc, path: Path, sub: string, modes: readonly string[]) {
    if (acc.submodule.has(path)) return;
    if (sub?.startsWith('S')) {
      this.markSubmodule(acc, path);
      return;
    }
    if (modes.some((mode) => mode === '160000')) {
      this.markSubmodule(acc, path);
    }
  },
  track(acc: PlanAcc, path: Path, xy: string) {
    const [x = '.', y = '.'] = xy.split('');

    if (x === 'A') {
      this.markAdd(acc, path);
    } else if (x === 'D') {
      this.markRemove(acc, path);
    } else if (x !== '.' && x !== ' ') {
      this.markModify(acc, path);
    }

    if (y === 'D') {
      this.markRemove(acc, path);
    } else if (y !== '.' && y !== ' ') {
      this.markModify(acc, path);
    }
  },
  build(acc: PlanAcc): t.CopyPlan {
    for (const target of acc.renameTargets) {
      acc.add.delete(target);
      acc.modify.delete(target);
    }
    for (const source of acc.renameSources) {
      acc.remove.delete(source);
    }

    return {
      add: sort([...acc.add]),
      modify: sort([...acc.modify]),
      remove: sort([...acc.remove]),
      rename: sortRenames(acc.renameEntries),
      conflict: sort([...acc.conflict]),
      submodule: sort([...acc.submodule]),
    };
  },
};

const sort = (items: Path[]) => items.sort((a, b) => a.localeCompare(b));

const sortRenames = (entries: RenameEntry[]) =>
  entries.slice().sort((a, b) => {
    const cmp = a.from.localeCompare(b.from);
    return cmp === 0 ? a.to.localeCompare(b.to) : cmp;
  });

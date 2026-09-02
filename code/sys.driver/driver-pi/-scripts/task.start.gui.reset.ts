import { c, Cli, Fs, Is, type t } from './common.ts';

const STORE_ROOT_SEGMENTS = Object.freeze(['.pi', '@sys', 'dist'] as const);

export const GUI_RELEASE_STORE_ROOT = STORE_ROOT_SEGMENTS.join('/') as '.pi/@sys/dist';
export const GUI_RELEASE_STORE_TARGETS = Object.freeze(
  [
    '@sys.driver-pi',
    '@sys/driver-pi',
  ] as const,
);

export type GuiReleaseStoreReset = Readonly<{
  path: `${typeof GUI_RELEASE_STORE_ROOT}/${(typeof GUI_RELEASE_STORE_TARGETS)[number]}`;
  kind: t.FsRooted.RemoveTreeResult['kind'];
}>;

type GuiReleaseStoreTarget = (typeof GUI_RELEASE_STORE_TARGETS)[number];
type StoreRootSelection =
  | Readonly<{ kind: 'present'; path: t.StringAbsoluteDir }>
  | Readonly<{ kind: 'absent' }>;

const TARGET_INPUTS = Object.freeze(
  GUI_RELEASE_STORE_TARGETS.map((path) => Object.freeze({ kind: 'directory' as const, path })),
);
const WORKSPACE_ROOT: t.StringAbsoluteDir = Fs.resolve(
  import.meta.dirname ?? '.',
  '../../../..',
);
const Rooted = Fs.Capability.Rooted;
const BUSY_RESET_FAILURES = new WeakMap<object, GuiReleaseStoreReset['path']>();

export async function resetGuiReleaseStores(
  workspaceRoot: t.StringDir,
): Promise<readonly GuiReleaseStoreReset[]> {
  const selected = await selectStoreRoot(workspaceRoot);
  if (selected.kind === 'absent') return absentSettlements();

  let rooted: t.FsRooted.Instance;
  try {
    rooted = await Rooted.create({ root: selected.path, create: false });
  } catch (cause) {
    throw resetFailure(`while binding ${GUI_RELEASE_STORE_ROOT}`, cause);
  }
  if (rooted.path !== selected.path) {
    throw new Error(
      `GUI Dist reset refused ${GUI_RELEASE_STORE_ROOT}: Rooted canonical path escaped the selected workspace root.`,
    );
  }

  let targets: readonly t.FsRooted.Target<'directory'>[];
  try {
    targets = (await rooted.Target.admit(TARGET_INPUTS)).targets;
  } catch (cause) {
    throw resetFailure(`while admitting ${displayPaths().join(', ')}`, cause);
  }

  let acquired: t.FsRooted.LeaseResult;
  try {
    acquired = await rooted.Lease.acquire(targets, { mode: 'exclusive', wait: false });
  } catch (cause) {
    throw resetFailure('while acquiring release-store ownership', cause);
  }
  if (acquired.kind === 'busy') {
    const target = GUI_RELEASE_STORE_TARGETS.find((value) => value === acquired.target.path);
    if (!target) {
      throw new Error(
        `GUI Dist reset refused ${GUI_RELEASE_STORE_ROOT}: Rooted reported contention outside the admitted GUI stores.`,
      );
    }
    throw busyResetFailure(displayPath(target));
  }

  const results: GuiReleaseStoreReset[] = [];
  let primaryFailure: unknown;
  for (let index = 0; index < targets.length; index++) {
    const target = GUI_RELEASE_STORE_TARGETS[index];
    try {
      const result = await rooted.Tree.remove(targets[index], { lease: acquired.lease });
      results.push(Object.freeze({ path: displayPath(target), kind: result.kind }));
    } catch (cause) {
      primaryFailure = resetFailure(
        `for ${displayPath(target)}`,
        cause,
        results.some((result) => result.kind === 'removed'),
      );
      break;
    }
  }

  let releaseFailure: unknown;
  try {
    await acquired.lease.release();
  } catch (cause) {
    releaseFailure = resetFailure(
      'while releasing release-store ownership',
      cause,
      results.some((result) => result.kind === 'removed'),
    );
  }

  if (primaryFailure && releaseFailure) {
    throw new AggregateError(
      [primaryFailure, releaseFailure],
      'GUI Dist reset and ownership release both failed; inspect the store before retrying.',
    );
  }
  if (primaryFailure) throw primaryFailure;
  if (releaseFailure) throw releaseFailure;
  return Object.freeze(results);
}

export function printGuiReleaseStoreReset(
  results: readonly GuiReleaseStoreReset[],
  print: (...data: unknown[]) => void = console.info,
): void {
  const table = Cli.table();
  for (const result of results) {
    const status = result.kind === 'removed'
      ? c.green('deleted')
      : c.italic(c.gray('already absent'));
    table.push([c.cyan('delete'), c.gray(result.path), status]);
  }

  print();
  print(c.bold('Dist Reset (GUI)'));
  print(table.toString().trim());
  print();
}

function printGuiReleaseStoreBusy(
  path: GuiReleaseStoreReset['path'],
  print: (...data: unknown[]) => void,
): void {
  const table = Cli.table();
  table.push([c.gray('state'), c.red('refused')]);
  table.push([c.gray('store'), c.gray(path)]);
  table.push([c.gray('reason'), c.white('another operation owns this store')]);
  table.push([c.gray('action'), c.white('stop it cleanly (start:gui: q or Ctrl+C)')]);
  table.push([c.gray('retry'), c.cyan('deno task reset')]);

  print();
  print(c.bold(c.red('Dist Reset Refused (GUI)')));
  print(table.toString().trim());
  print();
}

export async function main(
  workspaceRoot: t.StringDir = WORKSPACE_ROOT,
  print: (...data: unknown[]) => void = console.info,
  printError: (...data: unknown[]) => void = console.error,
): Promise<0 | 1> {
  try {
    printGuiReleaseStoreReset(await resetGuiReleaseStores(workspaceRoot), print);
    return 0;
  } catch (cause) {
    const path = busyResetPath(cause);
    if (!path) throw cause;
    printGuiReleaseStoreBusy(path, printError);
    return 1;
  }
}

if (import.meta.main) {
  const exitCode = await main();
  if (exitCode !== 0) Deno.exitCode = exitCode;
}

async function selectStoreRoot(workspaceRoot: t.StringDir): Promise<StoreRootSelection> {
  let workspace: t.StringAbsoluteDir;
  try {
    workspace = Fs.resolve(workspaceRoot);
  } catch (cause) {
    throw resetFailure('while resolving the workspace root', cause);
  }

  const workspaceInfo = await inspectStoreRootSegment(workspace);
  if (!workspaceInfo) {
    throw new Error(`GUI Dist reset refused ${workspace}: workspace root is missing.`);
  }
  assertDirectorySegment(workspace, workspaceInfo);
  await assertCanonicalSegment(workspace);

  let path: t.StringAbsoluteDir = workspace;
  for (const segment of STORE_ROOT_SEGMENTS) {
    path = Fs.join(path, segment);
    const info = await inspectStoreRootSegment(path);
    if (!info) return Object.freeze({ kind: 'absent' });
    assertDirectorySegment(path, info);
    await assertCanonicalSegment(path);
  }
  return Object.freeze({ kind: 'present', path });
}

async function inspectStoreRootSegment(
  path: t.StringAbsoluteDir,
): Promise<Deno.FileInfo | undefined> {
  try {
    return await Fs.lstat(path);
  } catch (cause) {
    throw resetFailure(`while inspecting ${path}`, cause);
  }
}

function assertDirectorySegment(path: t.StringAbsoluteDir, info: Deno.FileInfo): void {
  if (info.isSymlink) {
    throw new Error(`GUI Dist reset refused ${path}: store-root ancestry is a symlink.`);
  }
  if (!info.isDirectory) {
    throw new Error(`GUI Dist reset refused ${path}: store-root ancestry is not a directory.`);
  }
}

async function assertCanonicalSegment(path: t.StringAbsoluteDir): Promise<void> {
  let canonical: string;
  try {
    canonical = await Fs.realPath(path);
  } catch (cause) {
    throw resetFailure(`while resolving ${path}`, cause);
  }
  if (canonical !== path) {
    throw new Error(`GUI Dist reset refused ${path}: store-root ancestry is not canonical.`);
  }
}

function absentSettlements(): readonly GuiReleaseStoreReset[] {
  return Object.freeze(
    GUI_RELEASE_STORE_TARGETS.map((target) =>
      Object.freeze({ path: displayPath(target), kind: 'absent' as const })
    ),
  );
}

function displayPaths(): readonly GuiReleaseStoreReset['path'][] {
  return GUI_RELEASE_STORE_TARGETS.map(displayPath);
}

function displayPath(target: GuiReleaseStoreTarget): GuiReleaseStoreReset['path'] {
  return `${GUI_RELEASE_STORE_ROOT}/${target}`;
}

function busyResetFailure(path: GuiReleaseStoreReset['path']): Error {
  const error = new Error(
    `GUI Dist reset refused ${path}: another owner holds this store; finish or stop that owning operation, then retry.`,
  );
  BUSY_RESET_FAILURES.set(error, path);
  return error;
}

function busyResetPath(cause: unknown): GuiReleaseStoreReset['path'] | undefined {
  return Is.object(cause) ? BUSY_RESET_FAILURES.get(cause) : undefined;
}

function resetFailure(scope: string, cause: unknown, priorCommitted = false): Error {
  if (Rooted.Is.failure(cause)) {
    const recovery = cause.committed || priorCommitted
      ? 'filesystem state may have changed; inspect the store before retrying'
      : 'no owned removal committed; correct the filesystem state and retry';
    return new Error(
      `GUI Dist reset refused ${scope}: ${cause.operation}/${cause.kind}; ${recovery}.`,
      { cause },
    );
  }
  return new Error(`GUI Dist reset failed ${scope}; inspect the cause and retry.`, { cause });
}

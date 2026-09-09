import { Is as ServerIs } from '@sys/std/is/server';

import { c, Cli, Fs, Is, Obj, type t } from './common.ts';

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

const KEYS = Obj.deepFreeze({
  BUSY: ['kind', 'index', 'path'],
  FAILED: ['kind', 'completed', 'unattempted', 'failure', 'changed'],
  FAILURE: ['name', 'operation', 'kind', 'committed'],
  ITEM: ['index', 'path', 'kind'],
  SETTLED: ['kind', 'results'],
  TARGET: ['index', 'path'],
});
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

  let settlement: unknown;
  try {
    settlement = await rooted.Tree.removeBatch(GUI_RELEASE_STORE_TARGETS);
  } catch (cause) {
    throw resetFailure(`while removing ${displayPaths().join(', ')}`, cause);
  }
  return projectGuiReleaseStoreReset(settlement);
}

/** Admit and project one complete FS-owned reset transaction. */
export function projectGuiReleaseStoreReset(input: unknown): readonly GuiReleaseStoreReset[] {
  const settlement = admitBatchSettlement(input);
  if (!settlement) throw invalidBatchSettlement(input);

  if (settlement.kind === 'busy') {
    throw busyResetFailure(displayPath(GUI_RELEASE_STORE_TARGETS[settlement.index]));
  }

  if (settlement.kind === 'failed') {
    const primary = resetFailure(
      batchFailureScope(settlement),
      settlement.failure,
      settlement.changed,
      settlement,
    );
    if (!settlement.releaseError) throw primary;

    const release = resetFailure(
      'while releasing release-store ownership',
      settlement.releaseError,
      settlement.changed,
      settlement,
    );
    throw new AggregateError(
      [primary, release],
      'GUI Dist reset and ownership release both failed; inspect the store before retrying.',
      { cause: settlement },
    );
  }

  const results = Obj.deepFreeze(
    settlement.results.map((result) => ({
      path: displayPath(GUI_RELEASE_STORE_TARGETS[result.index]),
      kind: result.kind,
    })),
  );
  if (settlement.releaseError) {
    throw resetFailure(
      'while releasing release-store ownership',
      settlement.releaseError,
      results.some((result) => result.kind === 'removed'),
      settlement,
    );
  }
  return results;
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
  return Obj.deepFreeze(
    GUI_RELEASE_STORE_TARGETS.map((target) => ({
      path: displayPath(target),
      kind: 'absent' as const,
    })),
  );
}

function displayPaths(): readonly GuiReleaseStoreReset['path'][] {
  return GUI_RELEASE_STORE_TARGETS.map(displayPath);
}

function displayPath(target: GuiReleaseStoreTarget): GuiReleaseStoreReset['path'] {
  return `${GUI_RELEASE_STORE_ROOT}/${target}`;
}

function admitBatchSettlement(input: unknown): t.FsRooted.RemoveTreeBatchResult | undefined {
  if (!isFrozenData(input, ['kind'], false)) return;
  const result = input as Record<string, unknown>;
  switch (result.kind) {
    case 'settled':
      return admitSettled(result);
    case 'busy':
      return admitBusy(result);
    case 'failed':
      return admitFailed(result);
    default:
      return;
  }
}

function admitSettled(
  input: Record<string, unknown>,
): t.FsRooted.RemoveTreeBatchSettled | undefined {
  const hasReleaseError = Object.hasOwn(input, 'releaseError');
  if (!isFrozenData(input, hasReleaseError ? [...KEYS.SETTLED, 'releaseError'] : KEYS.SETTLED)) {
    return;
  }
  const results = input.results;
  if (!isFrozenArray(results) || results.length !== GUI_RELEASE_STORE_TARGETS.length) return;
  for (let index = 0; index < results.length; index++) {
    if (!isBatchItem(results[index], index)) return;
  }
  if (
    hasReleaseError &&
    (!isRootedFailure(input.releaseError) || input.releaseError.operation !== 'release-lease')
  ) return;
  return input as unknown as t.FsRooted.RemoveTreeBatchSettled;
}

function admitBusy(input: Record<string, unknown>): t.FsRooted.RemoveTreeBatchBusy | undefined {
  if (!isFrozenData(input, KEYS.BUSY) || !isTargetIndex(input.index)) return;
  if (input.path !== GUI_RELEASE_STORE_TARGETS[input.index]) return;
  return input as unknown as t.FsRooted.RemoveTreeBatchBusy;
}

function admitFailed(input: Record<string, unknown>): t.FsRooted.RemoveTreeBatchFailed | undefined {
  const hasCurrent = Object.hasOwn(input, 'current');
  const hasReleaseError = Object.hasOwn(input, 'releaseError');
  const keys = [
    ...KEYS.FAILED,
    ...(hasCurrent ? ['current'] : []),
    ...(hasReleaseError ? ['releaseError'] : []),
  ];
  if (!isFrozenData(input, keys) || !Is.bool(input.changed)) return;

  const failure = input.failure;
  if (!isRootedFailure(failure)) return;
  if (
    hasReleaseError &&
    (!isRootedFailure(input.releaseError) || input.releaseError.operation !== 'release-lease')
  ) return;

  const completed = input.completed;
  if (!isFrozenArray(completed) || completed.length > GUI_RELEASE_STORE_TARGETS.length) return;
  for (let index = 0; index < completed.length; index++) {
    if (!isBatchItem(completed[index], index)) return;
  }

  const current = hasCurrent && isBatchTarget(input.current, completed.length)
    ? input.current
    : undefined;
  if ((hasCurrent && !current) || (!hasCurrent && completed.length !== 0)) return;
  if (current) {
    if (failure.operation !== 'remove-tree') return;
  } else if (
    failure.operation !== 'admit' && failure.operation !== 'acquire-lease' &&
    failure.operation !== 'remove-tree-batch'
  ) return;

  const unattempted = input.unattempted;
  const unattemptedStart = current ? current.index + 1 : 0;
  if (
    !isFrozenArray(unattempted) ||
    unattempted.length !== GUI_RELEASE_STORE_TARGETS.length - unattemptedStart
  ) return;
  for (let index = 0; index < unattempted.length; index++) {
    if (!isBatchTarget(unattempted[index], unattemptedStart + index)) return;
  }

  const changed =
    completed.some((item) => (item as t.FsRooted.RemoveTreeBatchItem).kind === 'removed') ||
    failure.committed;
  if (input.changed !== changed) return;
  return input as unknown as t.FsRooted.RemoveTreeBatchFailed;
}

function isBatchItem(input: unknown, index: number): input is t.FsRooted.RemoveTreeBatchItem {
  if (!isFrozenData(input, KEYS.ITEM)) return false;
  const item = input as Record<string, unknown>;
  return item.index === index && item.path === GUI_RELEASE_STORE_TARGETS[index] &&
    (item.kind === 'removed' || item.kind === 'absent');
}

function isBatchTarget(input: unknown, index: number): input is t.FsRooted.RemoveTreeBatchTarget {
  if (!isTargetIndex(index) || !isFrozenData(input, KEYS.TARGET)) return false;
  const target = input as Record<string, unknown>;
  return target.index === index && target.path === GUI_RELEASE_STORE_TARGETS[index];
}

function isFrozenData(
  input: unknown,
  keys: readonly string[],
  exact = true,
): input is Record<string, unknown> {
  if (
    !Is.object(input) || ServerIs.Native.proxy(input) ||
    Object.getPrototypeOf(input) !== Object.prototype || !Object.isFrozen(input)
  ) return false;

  const actual = Reflect.ownKeys(input);
  if (exact && actual.length !== keys.length) return false;
  for (const key of keys) {
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (!property || !('value' in property) || property.enumerable !== true) return false;
  }
  return !exact || actual.every((key) => Is.string(key) && keys.includes(key));
}

function isFrozenArray(input: unknown): input is readonly unknown[] {
  if (
    ServerIs.Native.proxy(input) || !Is.array(input) ||
    Object.getPrototypeOf(input) !== Array.prototype || !Object.isFrozen(input)
  ) return false;
  if (Reflect.ownKeys(input).length !== input.length + 1) return false;
  for (let index = 0; index < input.length; index++) {
    const property = Object.getOwnPropertyDescriptor(input, String(index));
    if (!property || !('value' in property) || property.enumerable !== true) return false;
  }
  return true;
}

function isTargetIndex(input: unknown): input is 0 | 1 {
  return Is.number(input) && (input === 0 || input === 1);
}

function isRootedFailure(input: unknown): input is t.FsRooted.Failure {
  if (ServerIs.Native.proxy(input) || !ServerIs.Native.error(input)) return false;
  for (const key of Reflect.ownKeys(input)) {
    if (!Is.string(key)) return false;
    if (KEYS.FAILURE.some((expected) => expected === key)) continue;
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (!property || property.enumerable) return false;
  }
  for (const key of KEYS.FAILURE) {
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (
      !property || !('value' in property) || property.enumerable !== true ||
      property.writable !== false || property.configurable !== false
    ) return false;
  }
  return Rooted.Is.failure(input);
}

function batchFailureScope(result: t.FsRooted.RemoveTreeBatchFailed): string {
  if (result.current) {
    return `for ${displayPath(GUI_RELEASE_STORE_TARGETS[result.current.index])}`;
  }
  switch (result.failure.operation) {
    case 'admit':
      return `while admitting ${displayPaths().join(', ')}`;
    case 'acquire-lease':
      return 'while acquiring release-store ownership';
    default:
      return `while removing ${displayPaths().join(', ')}`;
  }
}

function invalidBatchSettlement(cause: unknown): Error {
  return new Error(
    `GUI Dist reset refused ${GUI_RELEASE_STORE_ROOT}: Rooted returned an invalid batch removal settlement.`,
    { cause },
  );
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

function resetFailure(
  scope: string,
  cause: unknown,
  priorCommitted = false,
  evidence: unknown = cause,
): Error {
  if (Rooted.Is.failure(cause)) {
    const recovery = cause.committed || priorCommitted
      ? 'filesystem state may have changed; inspect the store before retrying'
      : 'no owned removal committed; correct the filesystem state and retry';
    return new Error(
      `GUI Dist reset refused ${scope}: ${cause.operation}/${cause.kind}; ${recovery}.`,
      { cause: evidence },
    );
  }
  return new Error(`GUI Dist reset failed ${scope}; inspect the cause and retry.`, {
    cause: evidence,
  });
}

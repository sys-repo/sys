import { Dispose, Fs, Is, Num, Obj, Schedule, type t, Time } from './common.ts';
import {
  createGithubClient,
  type GithubClient,
  type GithubClientFailure,
  parseGithubRepo,
} from './u.client.ts';
import { resolveGithubRepoBundle } from './u.repo.resolve.ts';

const RELEASE_ACCEPT = 'application/octet-stream';
const BLOB_ACCEPT = 'application/vnd.github.raw+json';
const MAX_TIMER_MSECS = 2_147_483_647;
const COMMON_KEYS = ['repo', 'into', 'mode', 'limits', 'token', 'until'] as const;
const RELEASE_KEYS = [...COMMON_KEYS, 'tag', 'assets'] as const;
const REPO_KEYS = [...COMMON_KEYS, 'ref', 'path'] as const;
const REQUIRED_KEYS = ['repo', 'into', 'mode', 'limits'] as const;
const LIMIT_KEYS = ['metadataBytes', 'entries', 'fileBytes', 'totalBytes', 'totalTime'] as const;

type Snapshot = {
  readonly repo: string;
  readonly repoRef: { readonly owner: string; readonly repo: string };
  readonly into: t.StringAbsoluteDir;
  readonly mode: t.GithubPull.Mode;
  readonly limits: t.GithubPull.Limits;
  readonly token?: string;
  readonly until?: t.UntilInput;
};

type ReleaseSnapshot = Snapshot & {
  readonly tag?: string;
  readonly assets?: readonly string[];
};

type RepoSnapshot = Snapshot & {
  readonly ref?: string;
  readonly path?: string;
};

type Entry = {
  readonly source: t.StringUrl;
  readonly target: t.StringRelativePath;
  readonly requestPath: string;
  readonly accept: string;
  readonly expectedBytes?: t.NumberBytes;
};

type Operation = {
  readonly snapshot: Snapshot;
  readonly signal: AbortSignal;
  readonly client: GithubClient;
  readonly files: t.GithubPull.DownloadedFile[];
  readonly timedOut: () => boolean;
};

type PreparedTarget = {
  readonly publish: (index: number, bytes: Uint8Array) => Promise<void>;
};

type Validation<T> = { readonly ok: true; readonly data: T } | t.GithubPull.Failure;

type ReleaseMetadata = {
  readonly tag: string;
  readonly assets: readonly ReleaseAsset[];
};

type ReleaseAsset = {
  readonly id: number;
  readonly name: string;
  readonly size?: t.NumberBytes;
};

/** Bounded generic GitHub release and repository downloads. */
export const GithubPull: t.GithubPull.Lib = Object.freeze({
  release,
  repo,
});

async function release(args: t.GithubPull.ReleaseArgs): Promise<t.GithubPull.Outcome> {
  let checked: Validation<ReleaseSnapshot>;
  try {
    checked = snapshotRelease(args);
  } catch {
    return invalidFailure();
  }
  if (!checked.ok) return checked;
  const snapshot = checked.data;

  return await run(snapshot, async (operation) => {
    const repoPath = apiRepoPath(snapshot.repoRef);
    const endpoint = snapshot.tag
      ? `${repoPath}/releases/tags/${encodeURIComponent(snapshot.tag)}`
      : `${repoPath}/releases/latest`;
    const response = await operation.client.metadata(endpoint);
    if (!response.ok) return clientFailure(operation, response);

    const parsed = parseRelease(response.data);
    if (!parsed.ok) return failure(operation, 'source-failure', parsed.error);
    if (parsed.data.assets.length > snapshot.limits.entries) {
      return limitFailure(operation);
    }

    const selected = selectReleaseAssets(parsed.data.assets, snapshot.assets);
    if (!selected.ok) return failure(operation, 'source-failure', selected.error);
    if (selected.data.length > snapshot.limits.entries) return limitFailure(operation);

    const entries: Entry[] = [];
    const names = new Set<string>();
    let knownBytes = 0;
    for (const asset of selected.data) {
      const target = releaseTarget(asset.name);
      if (!target.ok) return failure(operation, 'unsafe-target', target.error);
      if (names.has(target.data)) {
        return failure(operation, 'unsafe-target', 'GitHub pull targets collide.');
      }
      names.add(target.data);

      if (asset.size !== undefined) {
        if (asset.size > snapshot.limits.fileBytes) return limitFailure(operation);
        knownBytes += asset.size;
        if (!Num.Is.safeInt(knownBytes) || knownBytes > snapshot.limits.totalBytes) {
          return limitFailure(operation);
        }
      }

      const requestPath = `${repoPath}/releases/assets/${asset.id}`;
      entries.push(Object.freeze({
        source: apiUrl(requestPath),
        target: target.data,
        requestPath,
        accept: RELEASE_ACCEPT,
        expectedBytes: asset.size,
      }));
    }

    const resolved: t.GithubPull.ReleaseResolved = Object.freeze({
      kind: 'github:release',
      repo: snapshot.repo,
      tag: parsed.data.tag,
      assets: Object.freeze(selected.data.map((asset) => asset.name)),
    });
    return await materialize(operation, resolved, Object.freeze(entries));
  });
}

async function repo(args: t.GithubPull.RepoArgs): Promise<t.GithubPull.Outcome> {
  let checked: Validation<RepoSnapshot>;
  try {
    checked = snapshotRepo(args);
  } catch {
    return invalidFailure();
  }
  if (!checked.ok) return checked;
  const snapshot = checked.data;

  return await run(snapshot, async (operation) => {
    const repoPath = apiRepoPath(snapshot.repoRef);
    let ref = snapshot.ref;
    if (!ref) {
      const metadata = await operation.client.metadata(repoPath);
      if (!metadata.ok) return clientFailure(operation, metadata);
      const parsed = parseRepository(metadata.data);
      if (!parsed.ok) return failure(operation, 'source-failure', parsed.error);
      ref = parsed.data.defaultBranch;
    }

    const commitResponse = await operation.client.metadata(
      `${repoPath}/commits/${encodeURIComponent(ref)}`,
    );
    if (!commitResponse.ok) return clientFailure(operation, commitResponse);
    const commit = parseCommit(commitResponse.data);
    if (!commit.ok) return failure(operation, 'source-failure', commit.error);

    const treeResponse = await operation.client.metadata(
      `${repoPath}/git/trees/${encodeURIComponent(commit.data.treeSha)}?recursive=1`,
    );
    if (!treeResponse.ok) return clientFailure(operation, treeResponse);
    const tree = parseTree(treeResponse.data);
    if (!tree.ok) return failure(operation, 'source-failure', tree.error);
    if (tree.data.entries.length > snapshot.limits.entries) return limitFailure(operation);

    const selected = resolveGithubRepoBundle({
      source: { repo: snapshot.repo, path: snapshot.path },
      ref,
      commit: commit.data,
      tree: tree.data,
    });
    if (!selected.ok) {
      return failure(
        operation,
        'source-failure',
        'GitHub repository source is not materializable.',
      );
    }
    if (selected.data.entries.length > snapshot.limits.entries) return limitFailure(operation);

    let knownBytes = 0;
    const entries: Entry[] = [];
    for (const entry of selected.data.entries) {
      if (entry.size !== undefined) {
        if (!isByteCount(entry.size) || entry.size > snapshot.limits.fileBytes) {
          return limitFailure(operation);
        }
        knownBytes += entry.size;
        if (!Num.Is.safeInt(knownBytes) || knownBytes > snapshot.limits.totalBytes) {
          return limitFailure(operation);
        }
      }

      const requestPath = `${repoPath}/git/blobs/${encodeURIComponent(entry.sha)}`;
      entries.push(Object.freeze({
        source: apiUrl(requestPath),
        target: entry.relativePath,
        requestPath,
        accept: BLOB_ACCEPT,
        expectedBytes: entry.size,
      }));
    }

    const resolved: t.GithubPull.RepoResolved = Object.freeze({
      kind: 'github:repo',
      repo: selected.data.repo,
      ref: selected.data.ref,
      commit: selected.data.commit,
      tree: selected.data.tree,
      path: selected.data.path,
    });
    return await materialize(operation, resolved, Object.freeze(entries));
  });
}

async function run(
  snapshot: Snapshot,
  execute: (operation: Operation) => Promise<t.GithubPull.Outcome>,
): Promise<t.GithubPull.Outcome> {
  let timedOut = false;
  let life: t.Abortable;
  try {
    life = Dispose.abortable(snapshot.until);
  } catch {
    return invalidFailure();
  }

  await Schedule.micro();
  const timer = startDeadline(snapshot.limits.totalTime, () => {
    if (life.signal.aborted) return;
    timedOut = true;
    life.dispose('github-pull.total-time');
  });
  const operation: Operation = {
    snapshot,
    signal: life.signal,
    client: createGithubClient({
      limits: snapshot.limits,
      token: snapshot.token,
      until: life.signal,
    }),
    files: [],
    timedOut: () => timedOut,
  };

  try {
    if (operation.signal.aborted) return cancelledFailure(operation);
    return await execute(operation);
  } catch (error) {
    return unexpectedFailure(operation, error);
  } finally {
    timer.cancel();
    life.dispose('github-pull.complete');
  }
}

async function materialize(
  operation: Operation,
  resolved: t.GithubPull.Resolved,
  entries: readonly Entry[],
): Promise<t.GithubPull.Outcome> {
  if (operation.signal.aborted) return cancelledFailure(operation, resolved);

  const prepared = await prepareTarget(operation, entries);
  if (!prepared.ok) return Object.freeze({ ...prepared, resolved });

  let downloadedBytes = 0;
  for (const [index, entry] of entries.entries()) {
    if (operation.signal.aborted) return cancelledFailure(operation, resolved);
    const remaining = operation.snapshot.limits.totalBytes - downloadedBytes;
    if (remaining <= 0) return limitFailure(operation, resolved);

    const downloaded = await operation.client.download(entry.requestPath, entry.accept, remaining);
    if (!downloaded.ok) return clientFailure(operation, downloaded, resolved);
    downloadedBytes += downloaded.data.byteLength;
    if (downloadedBytes > operation.snapshot.limits.totalBytes) {
      return limitFailure(operation, resolved);
    }
    if (entry.expectedBytes !== undefined && downloaded.data.byteLength !== entry.expectedBytes) {
      return failure(
        operation,
        'source-failure',
        'GitHub source byte size does not match metadata.',
        resolved,
      );
    }

    const file = Object.freeze({
      source: entry.source,
      target: entry.target,
      bytes: downloaded.data.byteLength as t.NumberBytes,
    });
    try {
      await prepared.data.publish(index, downloaded.data);
    } catch (error) {
      if (Fs.Capability.Rooted.Is.failure(error) && error.committed) operation.files.push(file);
      return rootedFailure(operation, error, resolved);
    }

    operation.files.push(file);
  }

  return Object.freeze({
    ok: true,
    into: operation.snapshot.into,
    resolved,
    files: Object.freeze([...operation.files]),
  });
}

async function prepareTarget(
  operation: Operation,
  entries: readonly Entry[],
): Promise<Validation<PreparedTarget>> {
  const { into, mode } = operation.snapshot;
  const parent = Fs.dirname(into) as t.StringDir;
  const name = Fs.basename(into);
  if (!name || parent === into) {
    return failure(operation, 'invalid-input', 'Invalid GitHub pull input.');
  }

  try {
    const parentRooted = await prepareParentRooted(parent, operation.signal);
    const directory = await parentRooted.Target.admit(
      [{ kind: 'directory', path: name }],
      { until: operation.signal },
    );
    const target = directory.targets[0]!;

    const exists = (await Fs.lstat(into)) !== undefined;
    if (mode === 'create' && exists) return occupiedFailure(operation);
    if (mode === 'replace' && exists) await Fs.remove(into, { log: false });
    if (operation.signal.aborted) return cancelledFailure(operation);

    const stage = await parentRooted.Stage.create({ until: operation.signal });
    const promotion = await parentRooted.Stage.promote(stage, target, {
      until: operation.signal,
    });
    if (promotion.cleanupError) {
      try {
        await parentRooted.Stage.discard(stage);
      } catch {
        // Preserve the original promotion failure after one safe cleanup retry.
      }
      return rootedFailure(operation, promotion.cleanupError);
    }
    if (promotion.kind === 'occupied') return occupiedFailure(operation);

    const rooted = await Fs.Capability.Rooted.create({ root: into, until: operation.signal });
    const admitted = await rooted.Target.admit(
      entries.map((entry) => ({ kind: 'file' as const, path: entry.target })),
      { until: operation.signal },
    );
    const targets = admitted.targets;
    return {
      ok: true,
      data: Object.freeze({
        async publish(index, bytes) {
          await rooted.File.publish(targets[index]!, bytes, { until: operation.signal });
        },
      }),
    };
  } catch (error) {
    return rootedFailure(operation, error);
  }
}

async function prepareParentRooted(path: t.StringDir, until: AbortSignal) {
  let cursor = Fs.resolve(path) as t.StringAbsoluteDir;
  while ((await Fs.lstat(cursor)) === undefined) {
    const parent = Fs.dirname(cursor) as t.StringAbsoluteDir;
    if (parent === cursor) break;
    cursor = parent;
  }

  await Fs.Capability.Rooted.create({ root: cursor, until });
  await Fs.ensureDir(path);
  return await Fs.Capability.Rooted.create({ root: path, until });
}

function snapshotRelease(input: unknown): Validation<ReleaseSnapshot> {
  const common = snapshotCommon(input, RELEASE_KEYS);
  if (!common.ok) return common;
  const value = input as Record<string, unknown>;

  const tag = optionalNonEmptyString(Obj.hasOwn(value, 'tag') ? value.tag : undefined);
  if (!tag.ok) return invalidFailure();

  let assets: readonly string[] | undefined;
  const assetsInput = Obj.hasOwn(value, 'assets') ? value.assets : undefined;
  if (assetsInput !== undefined) {
    if (!Array.isArray(assetsInput) || assetsInput.length === 0) return invalidFailure();
    const names: string[] = [];
    const seen = new Set<string>();
    for (const item of assetsInput) {
      if (!Is.str(item) || !item.trim() || item !== item.trim() || seen.has(item)) {
        return invalidFailure();
      }
      seen.add(item);
      names.push(item);
    }
    assets = Object.freeze(names);
  }

  return { ok: true, data: Object.freeze({ ...common.data, tag: tag.data, assets }) };
}

function snapshotRepo(input: unknown): Validation<RepoSnapshot> {
  const common = snapshotCommon(input, REPO_KEYS);
  if (!common.ok) return common;
  const value = input as Record<string, unknown>;
  const ref = optionalNonEmptyString(Obj.hasOwn(value, 'ref') ? value.ref : undefined);
  const path = optionalNonEmptyString(Obj.hasOwn(value, 'path') ? value.path : undefined);
  if (!ref.ok || !path.ok) return invalidFailure();
  return { ok: true, data: Object.freeze({ ...common.data, ref: ref.data, path: path.data }) };
}

function snapshotCommon(
  input: unknown,
  keys: readonly string[],
): Validation<Snapshot> {
  if (!exactRecord(input, keys) || !REQUIRED_KEYS.every((key) => Obj.hasOwn(input, key))) {
    return invalidFailure();
  }
  const repo = input.repo;
  const into = input.into;
  const mode = input.mode;
  const token = Obj.hasOwn(input, 'token') ? input.token : undefined;
  const until = Obj.hasOwn(input, 'until') ? input.until : undefined;
  const limits = input.limits;
  if (!Is.str(repo) || !Is.str(into) || !into.trim() || into.includes('\0')) {
    return invalidFailure();
  }
  if (mode !== 'create' && mode !== 'replace') return invalidFailure();
  if (token !== undefined && (!Is.str(token) || !token.trim())) return invalidFailure();
  if (
    !exactRecord(limits, LIMIT_KEYS) ||
    !LIMIT_KEYS.every((key) => Obj.hasOwn(limits, key))
  ) {
    return invalidFailure();
  }

  const snapshotLimits: t.GithubPull.Limits = {
    metadataBytes: limits.metadataBytes as number,
    entries: limits.entries as number,
    fileBytes: limits.fileBytes as number,
    totalBytes: limits.totalBytes as number,
    totalTime: limits.totalTime as number,
  };
  if (!validLimits(snapshotLimits)) return invalidFailure();

  let repoRef: Snapshot['repoRef'];
  try {
    repoRef = parseGithubRepo(repo);
  } catch {
    return invalidFailure();
  }

  return {
    ok: true,
    data: Object.freeze({
      repo,
      repoRef: Object.freeze(repoRef),
      into: Fs.resolve(into) as t.StringAbsoluteDir,
      mode,
      limits: Object.freeze(snapshotLimits),
      token: token?.trim(),
      until: until as t.UntilInput | undefined,
    }),
  };
}

function exactRecord(
  input: unknown,
  keys: readonly string[],
): input is Record<string, unknown> {
  return Is.record(input) &&
    Reflect.ownKeys(input).every((key) => Is.str(key) && keys.includes(key));
}

function validLimits(limits: t.GithubPull.Limits): boolean {
  return isPositiveSafeInteger(limits.metadataBytes) &&
    isPositiveSafeInteger(limits.entries) &&
    isPositiveSafeInteger(limits.fileBytes) &&
    isPositiveSafeInteger(limits.totalBytes) &&
    isPositiveSafeInteger(limits.totalTime) &&
    limits.fileBytes <= limits.totalBytes;
}

function parseRelease(input: unknown): Validation<ReleaseMetadata> {
  if (!Is.record(input) || !isSourceValue(input.tag_name)) {
    return sourceValidation('GitHub release metadata is malformed.');
  }
  if (!Array.isArray(input.assets)) {
    return sourceValidation('GitHub release metadata is malformed.');
  }

  const assets: ReleaseAsset[] = [];
  for (const item of input.assets) {
    if (!Is.record(item) || !isPositiveSafeInteger(item.id) || !Is.str(item.name) || !item.name) {
      return sourceValidation('GitHub release metadata is malformed.');
    }
    const size = item.size;
    if (size !== undefined && !isByteCount(size)) {
      return sourceValidation('GitHub release metadata is malformed.');
    }
    assets.push(Object.freeze({ id: item.id as number, name: item.name, size }));
  }
  if (assets.length === 0) return sourceValidation('GitHub release contains no assets.');
  return {
    ok: true,
    data: Object.freeze({ tag: input.tag_name, assets: Object.freeze(assets) }),
  };
}

function parseRepository(input: unknown): Validation<t.GithubSource.RepoMetadata> {
  if (!Is.record(input) || !isSourceValue(input.default_branch)) {
    return sourceValidation('GitHub repository metadata is malformed.');
  }
  return { ok: true, data: { defaultBranch: input.default_branch } };
}

function parseCommit(input: unknown): Validation<t.GithubSource.RepoCommit> {
  if (!Is.record(input) || !isSourceValue(input.sha)) {
    return sourceValidation('GitHub commit metadata is malformed.');
  }
  const commit = input.commit;
  const tree = Is.record(commit) ? commit.tree : undefined;
  if (!Is.record(tree) || !isSourceValue(tree.sha)) {
    return sourceValidation('GitHub commit metadata is malformed.');
  }
  return { ok: true, data: { sha: input.sha, treeSha: tree.sha } };
}

function parseTree(input: unknown): Validation<t.GithubSource.RepoTree> {
  if (
    !Is.record(input) ||
    !isSourceValue(input.sha) ||
    !Is.bool(input.truncated) ||
    !Array.isArray(input.tree)
  ) {
    return sourceValidation('GitHub tree metadata is malformed.');
  }

  const entries: t.GithubSource.RepoTreeEntry[] = [];
  for (const item of input.tree) {
    if (
      !Is.record(item) ||
      !Is.str(item.path) ||
      !Is.str(item.type) ||
      !Is.str(item.mode) ||
      !isSourceValue(item.sha)
    ) {
      return sourceValidation('GitHub tree metadata is malformed.');
    }
    const size = item.size;
    if (size !== undefined && !isByteCount(size)) {
      return sourceValidation('GitHub tree metadata is malformed.');
    }
    entries.push({
      path: item.path as t.StringPath,
      mode: item.mode,
      type: item.type,
      sha: item.sha,
      size,
    });
  }

  return {
    ok: true,
    data: {
      sha: input.sha,
      truncated: input.truncated,
      entries: Object.freeze(entries),
    },
  };
}

function selectReleaseAssets(
  assets: readonly ReleaseAsset[],
  wanted?: readonly string[],
): Validation<readonly ReleaseAsset[]> {
  if (!wanted) return { ok: true, data: assets };
  const selected: ReleaseAsset[] = [];
  for (const name of wanted) {
    const asset = assets.find((item) => item.name === name);
    if (!asset) return sourceValidation('GitHub release asset not found.');
    selected.push(asset);
  }
  return { ok: true, data: Object.freeze(selected) };
}

function releaseTarget(name: string): Validation<t.StringRelativePath> {
  if (name !== name.trim() || !name || name === '.' || name === '..') {
    return targetValidation('GitHub release asset name is unsafe.');
  }
  if (
    name.includes('/') || name.includes('\\') || /^[A-Za-z]:/.test(name) || hasControlChar(name)
  ) {
    return targetValidation('GitHub release asset name is unsafe.');
  }
  return { ok: true, data: name as t.StringRelativePath };
}

function clientFailure(
  operation: Operation,
  input: GithubClientFailure,
  resolved?: t.GithubPull.Resolved,
): t.GithubPull.Failure {
  if (input.kind === 'cancelled') return cancelledFailure(operation, resolved);
  return failure(operation, input.kind, input.error, resolved);
}

function rootedFailure(
  operation: Operation,
  error: unknown,
  resolved?: t.GithubPull.Resolved,
): t.GithubPull.Failure {
  if (Fs.Capability.Rooted.Is.failure(error)) {
    if (error.kind === 'cancelled') return cancelledFailure(operation, resolved);
    if (error.kind === 'occupied') return occupiedFailure(operation, resolved);
    if (
      error.kind === 'invalid-root' || error.kind === 'invalid-target' ||
      error.kind === 'target-collision' || error.kind === 'unsafe-filesystem'
    ) {
      return failure(operation, 'unsafe-target', 'GitHub pull target is unsafe.', resolved);
    }
    return failure(operation, 'publication-failure', 'GitHub pull publication failed.', resolved);
  }
  if (operation.signal.aborted) return cancelledFailure(operation, resolved);
  return failure(operation, 'publication-failure', 'GitHub pull publication failed.', resolved);
}

function unexpectedFailure(operation: Operation, error: unknown): t.GithubPull.Failure {
  if (Fs.Capability.Rooted.Is.failure(error)) return rootedFailure(operation, error);
  if (operation.signal.aborted) return cancelledFailure(operation);
  return failure(operation, 'source-failure', 'GitHub pull failed.');
}

function failure(
  operation: Operation,
  kind: t.GithubPull.FailureKind,
  error: string,
  resolved?: t.GithubPull.Resolved,
): t.GithubPull.Failure {
  return Object.freeze({
    ok: false,
    kind,
    error,
    into: operation.snapshot.into,
    resolved,
    files: Object.freeze([...operation.files]),
  });
}

function invalidFailure(): t.GithubPull.Failure {
  return Object.freeze({
    ok: false,
    kind: 'invalid-input',
    error: 'Invalid GitHub pull input.',
    files: Object.freeze([]),
  });
}

function limitFailure(
  operation: Operation,
  resolved?: t.GithubPull.Resolved,
): t.GithubPull.Failure {
  const error = operation.timedOut()
    ? 'GitHub pull total time exceeded.'
    : 'GitHub pull limit exceeded.';
  return failure(operation, 'limit-exceeded', error, resolved);
}

function occupiedFailure(
  operation: Operation,
  resolved?: t.GithubPull.Resolved,
): t.GithubPull.Failure {
  return failure(operation, 'target-occupied', 'GitHub pull target is occupied.', resolved);
}

function cancelledFailure(
  operation: Operation,
  resolved?: t.GithubPull.Resolved,
): t.GithubPull.Failure {
  return operation.timedOut()
    ? limitFailure(operation, resolved)
    : failure(operation, 'cancelled', 'GitHub pull cancelled.', resolved);
}

function sourceValidation<T>(error: string): Validation<T> {
  return { ok: false, kind: 'source-failure', error, files: Object.freeze([]) };
}

function targetValidation<T>(error: string): Validation<T> {
  return { ok: false, kind: 'unsafe-target', error, files: Object.freeze([]) };
}

function optionalNonEmptyString(
  input: unknown,
): { readonly ok: true; readonly data?: string } | { readonly ok: false } {
  if (input === undefined) return { ok: true };
  if (!isSourceValue(input)) return { ok: false };
  return { ok: true, data: input };
}

function startDeadline(msecs: number, onDeadline: () => void): { readonly cancel: () => void } {
  const deadline = performance.now() + msecs;
  let active = true;
  let timer: ReturnType<typeof Time.delay> | undefined;

  const schedule = () => {
    if (!active) return;
    const remaining = deadline - performance.now();
    if (remaining <= 0) {
      active = false;
      onDeadline();
      return;
    }
    timer = Time.delay(Math.max(1, Math.min(MAX_TIMER_MSECS, Math.ceil(remaining))), schedule);
  };

  schedule();
  return Object.freeze({
    cancel() {
      active = false;
      timer?.cancel();
    },
  });
}

function apiRepoPath(repo: Snapshot['repoRef']): string {
  return `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
}

function apiUrl(path: string): t.StringUrl {
  return `https://api.github.com${path}` as t.StringUrl;
}

function isPositiveSafeInteger(input: unknown): boolean {
  return Is.num(input) && Num.Is.safeInt(input) && input > 0;
}

function isByteCount(input: unknown): input is t.NumberBytes {
  return Is.num(input) && Num.Is.safeInt(input) && input >= 0;
}

function isSourceValue(input: unknown): input is string {
  return Is.str(input) &&
    input.length > 0 &&
    input === input.trim() &&
    input !== '.' &&
    input !== '..' &&
    !hasControlChar(input);
}

function hasControlChar(input: string): boolean {
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

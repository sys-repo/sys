import { Str, type t } from './common.ts';

const compare = Str.Compare.codeUnit();

type NormalizedGithubPath =
  | { readonly ok: true; readonly value: string; readonly segments: readonly string[] }
  | { readonly ok: false; readonly error: string };

type ScopedEntriesResult =
  | { readonly ok: true; readonly entries: readonly t.GithubSource.RepoTreeEntry[] }
  | { readonly ok: false; readonly error: string };

export function resolveGithubRepoBundle(args: {
  source: { readonly repo: string; readonly path?: string };
  ref: string;
  commit: t.GithubSource.RepoCommit;
  tree: t.GithubSource.RepoTree;
}): t.GithubSource.RepoResolveResult {
  const { source, ref, commit, tree } = args;
  if (tree.truncated) {
    return {
      ok: false,
      error:
        'GitHub repo tree is too large for recursive API materialization; tree result was truncated.',
    };
  }

  const path = normalizeGithubPath(source.path ?? '');
  if (!path.ok) return { ok: false, error: `GitHub repo path is invalid: ${path.error}` };

  const scoped = scopedEntries(tree.entries, path.segments);
  if (!scoped.ok) return scoped;

  const entries: t.GithubSource.RepoResolvedEntry[] = [];
  for (const item of scoped.entries) {
    const entryPath = normalizeGithubPath(item.path);
    if (!entryPath.ok) {
      return { ok: false, error: `GitHub repo tree entry is invalid: ${entryPath.error}` };
    }

    if (item.type === 'tree' && item.mode === '040000') continue;
    if (item.type === 'commit' || item.mode === '160000') {
      return {
        ok: false,
        error: `GitHub repo pull cannot materialize submodule entries yet: ${item.path}`,
      };
    }
    if (item.type === 'blob' && item.mode === '120000') {
      return {
        ok: false,
        error: `GitHub repo pull cannot materialize symlink entries yet: ${item.path}`,
      };
    }
    if (
      item.type !== 'blob' ||
      (item.mode !== '100644' && item.mode !== '100755')
    ) {
      return {
        ok: false,
        error: `GitHub repo pull cannot materialize unsupported tree entry (${
          item.type || 'unknown'
        }): ${item.path}`,
      };
    }
    if (!item.sha?.trim()) {
      return { ok: false, error: `GitHub repo blob entry is missing a sha: ${item.path}` };
    }

    const relativeSegments = entryPath.segments.slice(path.segments.length);
    const relativePath = relativeSegments.join('/');
    if (!relativePath) {
      return {
        ok: false,
        error:
          `GitHub repo path resolves to a file; github:repo path must be a directory: ${item.path}`,
      };
    }

    entries.push({
      relativePath: relativePath as t.StringRelativePath,
      sha: item.sha,
      size: item.size,
    });
  }

  if (entries.length === 0) {
    return {
      ok: false,
      error: path.value
        ? `GitHub repo path contains no materializable files: ${path.value}`
        : 'GitHub repo contains no materializable files.',
    };
  }

  const targets = entries.map((entry) => entry.relativePath).sort(compare);
  for (let index = 1; index < targets.length; index++) {
    const previous = targets[index - 1]!;
    const current = targets[index]!;
    if (current === previous || current.startsWith(`${previous}/`)) {
      return { ok: false, error: 'GitHub repo tree targets collide.' };
    }
  }

  return {
    ok: true,
    data: {
      repo: source.repo,
      ref,
      commit: commit.sha,
      tree: tree.sha,
      path: path.value || undefined,
      entries,
    },
  };
}

function normalizeGithubPath(input: string): NormalizedGithubPath {
  const raw = String(input ?? '');
  if (/^[A-Za-z]:/.test(raw)) return { ok: false, error: `drive-prefixed path: ${input}` };
  if (hasControlChar(raw)) return { ok: false, error: `control characters in path: ${input}` };
  if (raw.startsWith('/') || raw.startsWith('\\')) {
    return { ok: false, error: `absolute path: ${input}` };
  }
  if (raw.includes('\\')) {
    return { ok: false, error: `backslash path separators are not supported: ${input}` };
  }

  const segments = Str.splitPathSegments(raw);
  const bad = segments.find((segment) => segment === '.' || segment === '..');
  if (bad) return { ok: false, error: `invalid path segment: ${input}` };

  return { ok: true, value: segments.join('/'), segments };
}

function hasControlChar(input: string): boolean {
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) <= 0x1f) return true;
  }
  return false;
}

function scopedEntries(
  entries: readonly t.GithubSource.RepoTreeEntry[],
  prefix: readonly string[],
): ScopedEntriesResult {
  if (prefix.length === 0) return { ok: true, entries };

  const scoped: t.GithubSource.RepoTreeEntry[] = [];
  let exact: t.GithubSource.RepoTreeEntry | undefined;

  for (const entry of entries) {
    const path = normalizeGithubPath(entry.path);
    if (!path.ok) return { ok: false, error: `GitHub repo tree entry is invalid: ${path.error}` };

    if (sameSegments(path.segments, prefix)) exact = entry;
    if (startsWithSegments(path.segments, prefix) && path.segments.length > prefix.length) {
      scoped.push(entry);
    }
  }

  const label = prefix.join('/');
  if (exact?.type === 'commit' || exact?.mode === '160000') {
    return {
      ok: false,
      error: `GitHub repo pull cannot materialize submodule entries yet: ${label}`,
    };
  }
  if (exact?.type === 'blob' && exact.mode === '120000') {
    return {
      ok: false,
      error: `GitHub repo pull cannot materialize symlink entries yet: ${label}`,
    };
  }
  if (exact?.type === 'blob') {
    return {
      ok: false,
      error: `GitHub repo path resolves to a file; github:repo path must be a directory: ${label}`,
    };
  }
  if (exact && (exact.type !== 'tree' || exact.mode !== '040000')) {
    return {
      ok: false,
      error: `GitHub repo path resolves to an unsupported entry (${
        exact.type || 'unknown'
      }): ${label}`,
    };
  }
  if (!exact && scoped.length === 0) {
    return { ok: false, error: `GitHub repo path not found: ${label}` };
  }

  return { ok: true, entries: scoped };
}

function sameSegments(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && startsWithSegments(a, b);
}

function startsWithSegments(value: readonly string[], prefix: readonly string[]): boolean {
  if (value.length < prefix.length) return false;
  return prefix.every((segment, index) => value[index] === segment);
}

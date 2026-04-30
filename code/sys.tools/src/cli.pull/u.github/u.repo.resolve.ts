import { Str, type t } from './common.ts';

type NormalizedGithubPath =
  | { readonly ok: true; readonly value: string; readonly segments: readonly string[] }
  | { readonly ok: false; readonly error: string };

type ScopedEntriesResult =
  | { readonly ok: true; readonly entries: readonly t.GithubSource.RepoTreeEntry[] }
  | { readonly ok: false; readonly error: string };

export function resolveGithubRepoBundle(args: {
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle;
  ref: string;
  commit: t.GithubSource.RepoCommit;
  tree: t.GithubSource.RepoTree;
}): t.GithubSource.RepoResolveResult {
  const { bundle, ref, commit, tree } = args;
  if (tree.truncated) {
    return {
      ok: false,
      error:
        'GitHub repo tree is too large for recursive API materialization; tree result was truncated.',
    };
  }

  const path = normalizeGithubPath(bundle.path ?? '');
  if (!path.ok) return { ok: false, error: `GitHub repo path is invalid: ${path.error}` };

  const scoped = scopedEntries(tree.entries, path.segments);
  if (!scoped.ok) return scoped;

  const entries: t.GithubSource.RepoResolvedEntry[] = [];
  for (const item of scoped.entries) {
    const entryPath = normalizeGithubPath(item.path);
    if (!entryPath.ok) {
      return { ok: false, error: `GitHub repo tree entry is invalid: ${entryPath.error}` };
    }

    if (item.type === 'tree') continue;
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
    if (item.type !== 'blob') {
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
      sourcePath: entryPath.value as t.StringPath,
      relativePath: relativePath as t.StringRelativePath,
      sha: item.sha,
      size: item.size,
      url: item.url,
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

  return {
    ok: true,
    data: {
      repo: bundle.repo,
      ref,
      commit: commit.sha,
      tree: tree.sha,
      path: path.value || undefined,
      entries,
    },
  };
}

function normalizeGithubPath(input: string): NormalizedGithubPath {
  const raw = String(input ?? '').trim();
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
  if (exact && exact.type !== 'tree') {
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

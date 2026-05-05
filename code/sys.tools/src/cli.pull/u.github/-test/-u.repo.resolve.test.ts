import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { resolveGithubRepoBundle } from '../u.repo.resolve.ts';

describe('cli.pull/u.github → repo resolver', () => {
  it('maps root blobs into target-relative entries', () => {
    const res = resolveGithubRepoBundle({
      bundle: bundle(),
      ref: 'main',
      commit: commit(),
      tree: tree([
        file('README.md', 'sha-readme', 12),
        dir('src'),
        file('src/mod.ts', 'sha-mod', 34),
      ]),
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.ref).to.eql('main');
    expect(res.data.path).to.eql(undefined);
    expect(res.data.entries.map((entry) => entry.relativePath)).to.eql(['README.md', 'src/mod.ts']);
    expect(res.data.entries.map((entry) => entry.sha)).to.eql(['sha-readme', 'sha-mod']);
  });

  it('strips a selected subpath and writes its contents into the target root', () => {
    const res = resolveGithubRepoBundle({
      bundle: bundle({ path: 'packages/tooling' }),
      ref: 'main',
      commit: commit(),
      tree: tree([
        file('README.md', 'sha-root'),
        dir('packages'),
        dir('packages/tooling'),
        file('packages/tooling/mod.ts', 'sha-mod'),
        file('packages/tooling/nested/a.ts', 'sha-a'),
        file('packages/other/mod.ts', 'sha-other'),
      ]),
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.path).to.eql('packages/tooling');
    expect(res.data.entries.map((entry) => entry.relativePath)).to.eql(['mod.ts', 'nested/a.ts']);
  });

  it('fails clearly for nonexistent paths, truncated trees, symlinks, and submodules', () => {
    const missing = resolveGithubRepoBundle({
      bundle: bundle({ path: 'missing' }),
      ref: 'main',
      commit: commit(),
      tree: tree([file('README.md', 'sha-readme')]),
    });
    expect(missing.ok).to.eql(false);
    if (!missing.ok) expect(missing.error).to.include('path not found');

    const truncated = resolveGithubRepoBundle({
      bundle: bundle(),
      ref: 'main',
      commit: commit(),
      tree: { ...tree([file('README.md', 'sha-readme')]), truncated: true },
    });
    expect(truncated.ok).to.eql(false);
    if (!truncated.ok) expect(truncated.error).to.include('truncated');

    const symlink = resolveGithubRepoBundle({
      bundle: bundle(),
      ref: 'main',
      commit: commit(),
      tree: tree([{ ...file('latest', 'sha-link'), mode: '120000' }]),
    });
    expect(symlink.ok).to.eql(false);
    if (!symlink.ok) expect(symlink.error).to.include('symlink');

    const submodule = resolveGithubRepoBundle({
      bundle: bundle(),
      ref: 'main',
      commit: commit(),
      tree: tree([{
        path: 'vendor/tooling' as t.StringPath,
        type: 'commit',
        mode: '160000',
        sha: 'sha-sub',
      }]),
    });
    expect(submodule.ok).to.eql(false);
    if (!submodule.ok) expect(submodule.error).to.include('submodule');
  });

  it('rejects unsafe configured paths and tree entry paths', () => {
    const badPath = resolveGithubRepoBundle({
      bundle: bundle({ path: '../src' }),
      ref: 'main',
      commit: commit(),
      tree: tree([file('src/mod.ts', 'sha-mod')]),
    });
    expect(badPath.ok).to.eql(false);

    const backslashPath = resolveGithubRepoBundle({
      bundle: bundle({ path: 'src\\mod.ts' }),
      ref: 'main',
      commit: commit(),
      tree: tree([file('src/mod.ts', 'sha-mod')]),
    });
    expect(backslashPath.ok).to.eql(false);

    const badEntry = resolveGithubRepoBundle({
      bundle: bundle(),
      ref: 'main',
      commit: commit(),
      tree: tree([file('../evil.ts', 'sha-evil')]),
    });
    expect(badEntry.ok).to.eql(false);

    const backslashEntry = resolveGithubRepoBundle({
      bundle: bundle(),
      ref: 'main',
      commit: commit(),
      tree: tree([file('src\\mod.ts', 'sha-mod')]),
    });
    expect(backslashEntry.ok).to.eql(false);
  });
});

function bundle(
  input: Partial<t.PullTool.ConfigYaml.GithubRepoBundle> = {},
): t.PullTool.ConfigYaml.GithubRepoBundle {
  return {
    kind: 'github:repo',
    repo: 'owner/repo',
    local: { dir: 'pulled/repo' as t.StringRelativeDir },
    ...input,
  };
}

function commit(): t.PullTool.GithubRepoCommit {
  return { sha: 'commit-sha', treeSha: 'tree-sha' };
}

function tree(entries: readonly t.PullTool.GithubRepoTreeEntry[]): t.PullTool.GithubRepoTree {
  return { sha: 'tree-sha', truncated: false, entries };
}

function file(
  path: string,
  sha: string,
  size?: number,
): t.PullTool.GithubRepoTreeEntry {
  return {
    path: path as t.StringPath,
    type: 'blob',
    mode: '100644',
    sha,
    size,
    url: `https://api.github.test/blob/${sha}` as t.StringUrl,
  };
}

function dir(path: string): t.PullTool.GithubRepoTreeEntry {
  return { path: path as t.StringPath, type: 'tree', mode: '040000', sha: `tree-${path}` };
}

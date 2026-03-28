import { describe, expect, it } from '../../-test.ts';
import { WorkspaceGraph } from '../mod.ts';

describe('Workspace.Graph.packageEdges → order', () => {
  it('collapses module edges into package edges and orders packages deterministically', () => {
    const graph: import('../common.ts').t.WorkspaceGraph.LocalModuleGraph = {
      cwd: '/workspace',
      packages: [
        {
          path: 'code/a',
          manifestPath: 'code/a/deno.json',
          name: '@scope/a',
          entryPaths: ['code/a/src/mod.ts'],
        },
        {
          path: 'code/b',
          manifestPath: 'code/b/deno.json',
          name: '@scope/b',
          entryPaths: ['code/b/src/mod.ts'],
        },
        {
          path: 'code/c',
          manifestPath: 'code/c/deno.json',
          name: '@scope/c',
          entryPaths: ['code/c/src/mod.ts'],
        },
      ],
      roots: ['code/a/src/mod.ts', 'code/b/src/mod.ts', 'code/c/src/mod.ts'],
      modules: [
        { key: 'code/a/src/mod.ts', packagePath: 'code/a' },
        { key: 'code/b/src/mod.ts', packagePath: 'code/b' },
        { key: 'code/c/src/mod.ts', packagePath: 'code/c' },
      ],
      edges: [
        { from: 'code/b/src/mod.ts', to: 'code/a/src/mod.ts', kind: 'code' },
        { from: 'code/c/src/mod.ts', to: 'code/b/src/mod.ts', kind: 'type' },
        { from: 'code/c/src/mod.ts', to: 'code/a/src/mod.ts', kind: 'code' },
      ],
    };

    const packages = WorkspaceGraph.packageEdges(graph);
    expect(packages.edges).to.eql([
      {
        from: 'code/a',
        to: 'code/b',
        imports: [{ from: 'code/b/src/mod.ts', to: 'code/a/src/mod.ts', kind: 'code' }],
      },
      {
        from: 'code/a',
        to: 'code/c',
        imports: [{ from: 'code/c/src/mod.ts', to: 'code/a/src/mod.ts', kind: 'code' }],
      },
      {
        from: 'code/b',
        to: 'code/c',
        imports: [{ from: 'code/c/src/mod.ts', to: 'code/b/src/mod.ts', kind: 'type' }],
      },
    ]);

    const ordered = WorkspaceGraph.order(packages);
    expect(ordered.ok).to.equal(true);
    if (!ordered.ok) return;

    expect(ordered.items.map((item) => item.package.path)).to.eql(['code/a', 'code/b', 'code/c']);
    expect(ordered.items.map((item) => item.after)).to.eql([[], ['code/a'], ['code/a', 'code/b']]);
  });
});

import { describe, expect, it } from '../../-test.ts';
import { WorkspaceGraph } from '../mod.ts';

describe('Workspace.Graph dependent closure helpers', () => {
  it('derives dependent closure in stable workspace order', () => {
    const orderedPaths = ['pkg-a', 'pkg-b', 'pkg-c', 'pkg-d'];
    const edges = [
      { from: 'pkg-a', to: 'pkg-b' },
      { from: 'pkg-b', to: 'pkg-c' },
      { from: 'pkg-a', to: 'pkg-d' },
    ];

    expect(WorkspaceGraph.dependentClosure(['pkg-a'], edges, orderedPaths)).to.eql([
      'pkg-a',
      'pkg-b',
      'pkg-c',
      'pkg-d',
    ]);
  });

  it('minimizes selected roots to stable source groups', () => {
    const orderedPaths = ['pkg-a', 'pkg-b', 'pkg-c', 'pkg-d', 'pkg-e'];
    const edges = [
      { from: 'pkg-a', to: 'pkg-b' },
      { from: 'pkg-b', to: 'pkg-a' },
      { from: 'pkg-b', to: 'pkg-c' },
      { from: 'pkg-d', to: 'pkg-e' },
    ];

    expect(
      WorkspaceGraph.minimalDependentRoots(
        ['pkg-c', 'pkg-a', 'pkg-b', 'pkg-e', 'pkg-d'],
        edges,
        orderedPaths,
      ),
    ).to.eql(['pkg-a', 'pkg-d']);
  });
});

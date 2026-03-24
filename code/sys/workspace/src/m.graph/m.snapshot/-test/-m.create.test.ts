import { describe, expect, it } from '../../../-test.ts';
import { WorkspaceGraph } from '../../mod.ts';
import { D } from '../common.ts';

describe('Workspace.Graph.Snapshot.create', () => {
  it('creates a snapshot with canonical metadata and provenance', async () => {
    const snapshot = await WorkspaceGraph.Snapshot.create({
      graph: {
        orderedPaths: ['code/sys/types', 'code/sys/std'],
        edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
      },
    });

    expect(snapshot.graph).to.eql({
      orderedPaths: ['code/sys/types', 'code/sys/std'],
      edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
    });
    expect(snapshot['.meta'].schemaVersion).to.eql(1);
    expect(snapshot['.meta'].createdAt).to.be.a('number');
    expect(snapshot['.meta'].graphHash.startsWith('sha256-')).to.eql(true);
    expect(snapshot['.meta'].generator).to.eql(D.GENERATOR);
  });
});

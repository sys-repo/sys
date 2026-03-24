import { describe, expect, Fs, it, Testing } from '../../../-test.ts';
import { WorkspaceGraph } from '../../mod.ts';

describe('Workspace.Graph.Snapshot.read/write', () => {
  it('writes and reads a persisted snapshot roundtrip', async () => {
    const fs = await Testing.dir('WorkspaceGraph.Snapshot.read-write');
    const path = Fs.join(fs.dir, 'workspace.graph.json');
    const snapshot = await WorkspaceGraph.Snapshot.create({
      graph: {
        orderedPaths: ['code/sys/types', 'code/sys/std'],
        edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
      },
    });

    const written = await WorkspaceGraph.Snapshot.write(snapshot, path);
    const read = await WorkspaceGraph.Snapshot.read(path);

    expect(read).to.eql(written);
    expect(written.graph).to.eql(snapshot.graph);
    expect(written['.meta'].createdAt).to.eql(snapshot['.meta'].createdAt);
    expect(written['.meta'].modifiedAt).to.be.a('number');
  });
});

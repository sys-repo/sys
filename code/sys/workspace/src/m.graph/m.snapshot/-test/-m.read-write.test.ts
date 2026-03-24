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

  it('overwrites legacy top-level graph fields instead of preserving stale keys', async () => {
    const fs = await Testing.dir('WorkspaceGraph.Snapshot.write.overwrite');
    const path = Fs.join(fs.dir, 'workspace.graph.json');

    await Fs.writeJson(path, {
      '.meta': {
        createdAt: 1,
        modifiedAt: 2,
        schemaVersion: 1,
        hash: { graph: 'sha256-old' },
        generator: {
          type: 'https://jsr.io/@sys/workspace/0.0.1/src/m.graph/t.ts',
          pkg: { name: '@sys/workspace', version: '0.0.1' },
        },
      },
      orderedPaths: ['stale/a'],
      edges: [{ from: 'stale/a', to: 'stale/b' }],
      stale: true,
    });

    const snapshot = WorkspaceGraph.Snapshot.create({
      graph: {
        orderedPaths: ['code/sys/types', 'code/sys/std'],
        edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
      },
    });

    const written = await WorkspaceGraph.Snapshot.write(snapshot, path);
    const raw = await Fs.readJson<Record<string, unknown>>(path);

    expect(written.graph).to.eql(snapshot.graph);
    expect(raw.data?.graph).to.eql(snapshot.graph);
    expect(raw.data?.orderedPaths).to.eql(undefined);
    expect(raw.data?.edges).to.eql(undefined);
    expect(raw.data?.stale).to.eql(undefined);
  });
});

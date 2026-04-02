import { describe, expect, it, Obj } from '../../../-test.ts';
import { WorkspaceGraph } from '../../mod.ts';
import { D } from '../common.ts';

type O = Record<string, unknown>;

describe('Workspace.Graph.Snapshot.create', () => {
  it('creates a snapshot with canonical metadata and provenance', async () => {
    const snapshot = WorkspaceGraph.Snapshot.create({
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
    expect(snapshot['.meta'].hash['/graph'].startsWith('sha256-')).to.eql(true);
    expect(snapshot['.meta'].generator).to.eql(D.GENERATOR);
    const path = Obj.Path.decode('/graph');
    expect(path).to.eql(['graph']);
    expect(Obj.Path.get(snapshot as O, path)).to.eql(snapshot.graph);
    const hashPath = Obj.Path.decode('/.meta/hash/~1graph');
    expect(hashPath).to.eql(['.meta', 'hash', '/graph']);
    expect(Obj.Path.get(snapshot as O, hashPath)).to.eql(snapshot['.meta'].hash['/graph']);
  });
});

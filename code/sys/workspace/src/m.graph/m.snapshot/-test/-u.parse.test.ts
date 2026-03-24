import { describe, expect, it } from '../../../-test.ts';
import { parseSnapshot } from '../u.parse.ts';
import { D } from '../common.ts';

describe('Workspace.Graph.Snapshot.parse', () => {
  it('accepts a valid persisted snapshot shape', () => {
    const snapshot = parseSnapshot({
      '.meta': {
        createdAt: 123,
        schemaVersion: D.schemaVersion,
        graphHash: 'sha256-abc',
        generator: D.GENERATOR,
      },
      graph: {
        orderedPaths: ['code/sys/types'],
        edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
      },
    });

    expect(snapshot).to.eql({
      '.meta': {
        createdAt: 123,
        schemaVersion: D.schemaVersion,
        graphHash: 'sha256-abc',
        generator: D.GENERATOR,
      },
      graph: {
        orderedPaths: ['code/sys/types'],
        edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
      },
    });
  });

  it('rejects invalid schema versions', () => {
    const snapshot = parseSnapshot({
      '.meta': {
        createdAt: 123,
        schemaVersion: 2,
        graphHash: 'sha256-abc',
        generator: D.GENERATOR,
      },
      graph: { orderedPaths: [], edges: [] },
    });

    expect(snapshot).to.eql(undefined);
  });

  it('rejects malformed graph edges', () => {
    const snapshot = parseSnapshot({
      '.meta': {
        createdAt: 123,
        schemaVersion: D.schemaVersion,
        graphHash: 'sha256-abc',
        generator: D.GENERATOR,
      },
      graph: {
        orderedPaths: ['code/sys/types'],
        edges: [{ from: 'code/sys/types', to: 123 }],
      },
    });

    expect(snapshot).to.eql(undefined);
  });

  it('rejects malformed generator package metadata', () => {
    const snapshot = parseSnapshot({
      '.meta': {
        createdAt: 123,
        schemaVersion: D.schemaVersion,
        graphHash: 'sha256-abc',
        generator: {
          ...D.GENERATOR,
          pkg: { name: '@sys/workspace', version: 123 },
        },
      },
      graph: { orderedPaths: [], edges: [] },
    });

    expect(snapshot).to.eql(undefined);
  });
});

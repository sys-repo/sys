import { describe, expect, it } from '../../-test.ts';
import { toNode } from '../u.topological.ts';

describe('Workspace.Graph.toNode', () => {
  it('adapts a package path to the topological node key', () => {
    const node = toNode({
      path: 'code/sys.driver/driver-deno',
      manifestPath: 'code/sys.driver/driver-deno/deno.json',
      entryPaths: ['code/sys.driver/driver-deno/src/mod.ts'],
      name: '@sys/driver-deno',
    });

    expect(node.key).to.eql('code/sys.driver/driver-deno');
    expect(node.decision.input.subject.entry.module.toString()).to.eql('npm:sys-driver-deno@0.0.0');
  });

  it('falls back to the package path when no package name exists', () => {
    const node = toNode({
      path: 'deploy/@tdb.slc.std',
      manifestPath: 'deploy/@tdb.slc.std/deno.json',
      entryPaths: ['deploy/@tdb.slc.std/src/mod.ts'],
    });

    expect(node.decision.input.subject.entry.module.toString()).to.eql(
      'npm:deploy-tdb-slc-std@0.0.0',
    );
  });

  it('normalizes repeated punctuation into a stable npm-safe stem', () => {
    const node = toNode({
      path: 'code/pkg',
      manifestPath: 'code/pkg/deno.json',
      entryPaths: ['code/pkg/src/mod.ts'],
      name: '@scope/foo__bar...baz',
    });

    expect(node.decision.input.subject.entry.module.toString()).to.eql(
      'npm:scope-foo-bar-baz@0.0.0',
    );
  });
});

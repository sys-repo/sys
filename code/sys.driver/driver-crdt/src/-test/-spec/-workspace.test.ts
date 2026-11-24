import manifest from '../../../deno.json' with { type: 'json' };
import { describe, expect, it, Semver } from '../-test.ts';

describe('Workspace fixture boundary', () => {
  it('workspace identity → retains its name and a valid version across bumps', () => {
    expect(manifest.name).to.equal('@sys/driver-crdt');
    // Workspace bumps may change the version; it is not the privacy boundary.
    expect(Semver.Is.valid(manifest.version), manifest.version).to.equal(true);
  });

  it('test-only package → remains private with no public exports', () => {
    expect(manifest.private).to.equal(true);
    expect(manifest.exports).to.eql({});
  });
});

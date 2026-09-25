import manifest from '../../../deno.json' with { type: 'json' };
import { describe, expect, it } from '../-test.ts';

describe('Workspace fixture boundary', () => {
  it('test-only package → has runner identity without a public API', () => {
    expect(manifest.name).to.equal('@sys/driver-crdt');
    expect(manifest.version).to.equal('0.0.0');
    expect(manifest.private).to.equal(true);
    expect(manifest.exports).to.eql({});
  });
});

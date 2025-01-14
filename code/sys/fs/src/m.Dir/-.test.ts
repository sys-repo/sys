import { describe, expect, it } from '../-test.ts';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { DirSnapshot } from '../m.Dir.Snapshot/mod.ts';
import { Dir } from './mod.ts';

describe('Fs.Dir', () => {
  it('API', async () => {
    const m = await import('@sys/fs/dir');
    expect(m.Dir).to.equal(Dir);
    expect(m.Dir.Hash).to.equal(DirHash);
    expect(m.Dir.Snapshot).to.equal(DirSnapshot);
  });
});

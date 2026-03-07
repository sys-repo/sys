import { describe, expect, it } from '../-test.ts';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { Dir } from './mod.ts';

describe('Fs.Dir', () => {
  it('API', async () => {
    const m = await import('@sys/fs/dir');
    expect(m.Dir).to.equal(Dir);
    expect(m.Dir.Hash).to.equal(DirHash);
  });
});

import { describe, expect, it } from '../../-test.ts';
import { SlugTreeFs } from '../common.ts';
import { SlugTreeFs as SlugTreeFsUpstream } from '@sys/model-slug/fs';

describe('SlugTree.ref', () => {
  it('routes through the shared fs helper', () => {
    expect(SlugTreeFs.normalizeCrdtRef).to.equal(SlugTreeFsUpstream.normalizeCrdtRef);
  });
});

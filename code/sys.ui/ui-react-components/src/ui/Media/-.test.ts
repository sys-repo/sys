import { describe, expect, it } from '../../-test.ts';
import { Video } from '../Media.Video/mod.ts';
import { Media } from './mod.ts';

describe('Media', () => {
  it('API', () => {
    expect(Media.Video).to.equal(Video);
  });
});

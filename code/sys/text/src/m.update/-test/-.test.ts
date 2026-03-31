import { describe, expect, it } from '../../-test.ts';
import { Update as PublicUpdate } from '@sys/text/update';
import { Update } from '../mod.ts';

describe(`Update`, () => {
  it('API', () => {
    expect(PublicUpdate).to.equal(Update);
  });
});

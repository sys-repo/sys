import { describe, expect, it } from '../../-test.ts';
import { Color, Theme } from '../mod.ts';

describe('Color', () => {
  it('API', () => {
    expect(Color.Theme).to.equal(Theme);
  });
});

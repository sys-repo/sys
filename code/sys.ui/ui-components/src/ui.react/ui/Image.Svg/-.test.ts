import { describe, expect, it } from '../../-test.ts';
import { Svg } from './mod.ts';

describe('Image.Svg', () => {
  it('API', async () => {
    const { SvgElement } = await import('./common.ts');
    expect(Svg.Element).to.equal(SvgElement);
  });
});

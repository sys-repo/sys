import { describe, expect, it } from '../../-test.ts';
import { Svg } from './mod.ts';

describe('Image.Svg', () => {
  it('API', async () => {
    const { SvgElement } = await import('./common.ts');
    expect(Svg.Element).to.equal(SvgElement);
  });

  it('import: Sample', async () => {
    /**
     * NOTE: this will cause an error in Deno, as '.svg' imports are not supported.
     * Solutions:
     *    - Explore using the FileMap.
     */
    // const { Sample } = await import('./-SPEC.Sample.tsx');
  });
});

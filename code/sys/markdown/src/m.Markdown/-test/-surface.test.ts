import { type t, describe, expect, expectTypeOf, it, pkg } from '../../-test.ts';
import { Markdown as PackageMarkdown } from '../../mod.ts';
import { Markdown } from '../mod.ts';

describe('m.Markdown/surface', () => {
  it('is the package-root Markdown surface', () => {
    expect(pkg.name).to.eql('@sys/markdown');
    expect(PackageMarkdown).to.equal(Markdown);
    expectTypeOf(Markdown).toEqualTypeOf<t.Markdown.Lib>();
  });
});

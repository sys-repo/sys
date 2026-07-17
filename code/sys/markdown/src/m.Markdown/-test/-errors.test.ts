import { describe, expect, it } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { invalidAst } from './u.fixture.ts';

describe('m.Markdown/errors', () => {
  it('normalizes stringify failures into the package result shape', () => {
    const res = Markdown.stringify(invalidAst());

    expect(res.data).to.eql(undefined);
    expect(res.error?.message).to.eql('Failed to stringify Markdown');
  });
});

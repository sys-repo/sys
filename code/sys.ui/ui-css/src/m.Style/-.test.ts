import { Color, describe, expect, it } from '../-test.ts';
import { Edges, Style } from './mod.ts';
import { css } from './u.transform.ts';

describe('Style', () => {
  it('API', () => {
    expect(Style.css).to.equal(css);
    expect(Style.Edges).to.equal(Edges);
    expect(Style.toMargins).to.equal(Edges.toMargins);
    expect(Style.toPadding).to.equal(Edges.toPadding);
    expect(Style.Color).to.equal(Color);
  });
});

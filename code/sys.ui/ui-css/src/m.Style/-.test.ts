import { describe, expect, it } from '../-test.ts';
import { Color, Edges, Style, css } from '../mod.ts';
import { transform } from './u.transform.ts';

describe('Style', () => {
  it('API', () => {
    expect(Style.Edges).to.equal(Edges);
    expect(Style.Color).to.equal(Color);

    expect(Style.css).to.equal(css);
    expect(Style.transform).to.equal(transform);

    expect(Style.toMargins).to.equal(Edges.toMargins);
    expect(Style.toPadding).to.equal(Edges.toPadding);
  });
});

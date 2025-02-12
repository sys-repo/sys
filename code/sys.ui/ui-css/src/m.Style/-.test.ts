import { Color, describe, expect, it } from '../-test.ts';
import { Edges, Style } from './mod.ts';
import { transform } from './u.transform.ts';

describe('Style', () => {
  it('API', () => {
    expect(Style.transform).to.equal(transform);
    expect(Style.Edges).to.equal(Edges);
    expect(Style.toMargins).to.equal(Edges.toMargins);
    expect(Style.toPadding).to.equal(Edges.toPadding);
    expect(Style.Color).to.equal(Color);
  });
});

import { describe, expect, it } from '../../-test.ts';
import { D } from './common.ts';
import { Programme } from './mod.ts';

describe('Programme', () => {
  it('create (defaults)', () => {
    const model = Programme.Signals.create();
    const p = model.props;

    expect(p.debug).to.eql(false);
    expect(p.align).to.eql(D.align);
    expect(p.media).to.eql(D.media);
    expect(p.section).to.eql(D.section);
  });

  it('init (with content)', () => {
    const content = Programme.factory();
    const model = Programme.Signals.init({ content });
    const p = model.props;

    expect(p.media.value).to.exist;
    expect(p.media.value).to.equal(content.media);
  });
});

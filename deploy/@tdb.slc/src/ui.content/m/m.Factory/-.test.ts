import { describe, expect, it } from '../../../-test.ts';
import { Content } from '../mod.ts';
import { VIDEO } from '../../-VIDEO.ts';

describe('Content.Factory', () => {
  it('Entry', async () => {
    const a = await Content.Factory.entry();
    const b = await Content.factory('Entry');
    expect(a?.id).to.eql('Entry');
    expect(b?.id).to.equal(a?.id);
  });

  it('Trailer', async () => {
    const a = await Content.Factory.trailer();
    const b = await Content.factory('Trailer');
    expect(a?.id).to.eql('Trailer');
    expect(b?.id).to.equal(a?.id);
    expect(a.media?.video.src).to.eql(VIDEO.Trailer.src);
  });

  it('Overview', async () => {
    const a = await Content.Factory.overview();
    const b = await Content.factory('Overview');
    expect(a?.id).to.eql('Overview');
    expect(b?.id).to.equal(a?.id);
    expect(a.media?.video.src).to.eql(VIDEO.Overview.src);
  });

  it('Programme', async () => {
    const a = await Content.Factory.programme();
    const b = await Content.factory('Programme');
    expect(a?.id).to.eql('Programme');
    expect(b?.id).to.equal(a?.id);
  });
});

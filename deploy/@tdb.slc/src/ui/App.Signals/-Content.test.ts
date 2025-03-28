import { describe, expect, it } from '../../-test.ts';
import { App, VIDEO } from './mod.ts';

describe('Content', () => {
  it('Entry', async () => {
    const res = await App.Content.find('Entry');
    expect(res?.id).to.eql('Entry');
  });

  it('Trailer', async () => {
    const res = await App.Content.find('Trailer');
    expect(res?.video?.src).to.eql(VIDEO.Trailer.src);
  });

  it('Overview', async () => {
    const res = await App.Content.find('Overview');
    expect(res?.video?.src).to.eql(VIDEO.Overview.src);
  });

  it('Programme', async () => {
    const res = await App.Content.find('Programme');
    expect(res?.id).to.eql('Programme');
  });

  it('Not Found', async () => {
    const res = await App.Content.find('Foobar' as any);
    expect(res).to.eql(undefined);
  });
});

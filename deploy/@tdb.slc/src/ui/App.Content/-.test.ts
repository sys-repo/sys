import { describe, expect, it } from '../../-test.ts';
import { AppContent, VIDEO } from './mod.ts';

describe('Content', () => {
  it('Entry', async () => {
    const res = await AppContent.find('Entry');
    expect(res?.id).to.eql('Entry');
    expect(res?.solidBackground).to.eql(undefined);
  });

  it('Trailer', async () => {
    const res = await AppContent.find('Trailer');
    expect(res?.video?.src).to.eql(VIDEO.Trailer.src);
    expect(typeof res?.solidBackground === 'function').to.be.true;
  });

  it('Overview', async () => {
    const res = await AppContent.find('Overview');
    expect(res?.video?.src).to.eql(VIDEO.Overview.src);
  });

  it('Programme', async () => {
    const res = await AppContent.find('Programme');
    expect(res?.id).to.eql('Programme');
  });

  it('Not Found', async () => {
    const res = await AppContent.find('Foobar' as any);
    expect(res).to.eql(undefined);
  });
});

import { Fs, describe, expect, expectTypeOf, Is, it } from '../../../-test.ts';
import { Provider } from '../mod.ts';

describe('Provider: probe', () => {
  it('returns a stable availability shape for orbiter', async () => {
    const cwd = (await Fs.makeTempDir()).absolute;
    const res = await Provider.probe(cwd, { kind: 'orbiter', siteId: 'site', domain: 'tmp' });

    expect(typeof res).to.eql('object');
    expect('ok' in res).to.eql(true);
    expectTypeOf(res).toMatchTypeOf<{ readonly ok: boolean }>();

    if (!res.ok) {
      expect(typeof res.reason).to.eql('string');
      if ('hint' in res) expect(res.hint === undefined || Is.str(res.hint)).to.eql(true);
      if ('error' in res) expect(true).to.eql(true);
    }
  });

  it('recognizes deno as a known pending provider', async () => {
    const cwd = (await Fs.makeTempDir()).absolute;
    const res = await Provider.probe(cwd, { kind: 'deno', app: 'my-app' });

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.reason).to.eql('unsupported-provider');
      expect(res.hint).to.eql('Deno provider recognized, but deploy runtime wiring has not landed yet.');
    }
  });

  it('treats noop as available', async () => {
    const cwd = (await Fs.makeTempDir()).absolute;
    const res = await Provider.probe(cwd, { kind: 'noop' });
    expect(res.ok).to.eql(true);
  });

  it('returns no-provider when provider is omitted', async () => {
    const cwd = (await Fs.makeTempDir()).absolute;
    const res = await Provider.probe(cwd, undefined);

    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.reason).to.eql('no-provider');
      expect(res.hint).to.eql('No provider configured for this endpoint.');
    }
  });
});

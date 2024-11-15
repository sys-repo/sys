import { Semver } from '@sys/std/semver';
import { describe, expect, it } from '../-test.ts';
import { Fetch, Jsr } from './mod.ts';

describe('Jsr', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
  });

  describe('Jsr.Fetch.Pkg', () => {
    it('Pkg.versions("name")', async () => {
      const name = '@sys/std';
      const res = await Fetch.Pkg.versions(name);

      expect(res.url).to.eql(`https://jsr.io/${name}/meta.json`);
      expect(res.status).to.eql(200);
      expect(res.error).to.eql(undefined);

      expect(res.data?.scope).to.eql('sys');
      expect(res.data?.name).to.eql('std');

      const versions = Object.keys(res.data?.versions ?? []);
      expect(versions).to.include('0.0.1');
      expect(versions).to.include('0.0.42');
      expect(Semver.Is.valid(res.data?.latest)).to.eql(true);
    });

    /**
     * TODO 🐷
     * - Fetch.Pkg.versions
     * - Fetch.Pkg.info
     *
     * - move to @sys/std OR @sys/jsr
     *
     * + compare checksums from JSR with {dist.json:hash}
     */

    it.skip('specific version ← via {pkg}', async () => {});

    it.skip('404: module does not exist', async () => {});

    it.skip('dispose ← (cancel fetch operation)', async () => {});

    it.skip('', async () => {});
    it.skip('', async () => {});
    it.skip('', async () => {});
    it.skip('', async () => {});
    it.skip('', async () => {});
    it.skip('', async () => {});
  });
});

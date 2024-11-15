import { Semver } from '@sys/std/semver';
import { describe, expect, it } from '../-test.ts';
import { Fetch, Jsr } from './mod.ts';

describe('Jsr', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
  });

  describe('Jsr.Fetch', () => {
    it('packageMeta: from "name"', async () => {
      const name = '@sys/std';
      const res = await Fetch.packageMeta(name);

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

    it.skip('', async () => {});
    it.skip('', async () => {});
  });
});

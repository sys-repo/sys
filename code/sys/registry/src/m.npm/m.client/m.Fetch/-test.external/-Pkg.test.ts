import { c, describe, expect, it, Testing } from '../../../-test.ts';
import { Npm } from '../../mod.ts';

describe('Npm.Fetch.Pkg (external)', () => {
  describe('Pkg.versions( name )', () => {
    it('200 - list', async () => {
      await Testing.retry(3, async () => {
        const name = 'react';
        const res = await Npm.Fetch.Pkg.versions(name);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);
        expect(res.url).to.eql('https://registry.npmjs.org/react');
        expect(res.data?.name).to.eql('react');
        expect(typeof res.data?.latest).to.eql('string');
        expect(Object.keys(res.data?.versions ?? {}).length > 0).to.eql(true);

        console.info();
        console.info(
          c.bold(c.brightCyan('Npm.Fetch.Pkg.versions:')),
          {
            ok: res.ok,
            status: res.status,
            url: res.url,
            data: {
              name: res.data?.name,
              latest: res.data?.latest,
              versions: Object.keys(res.data?.versions ?? {}).length,
            },
            error: res.error,
          },
        );
        console.info();
      });
    });

    it('404: package does not exist', async () => {
      await Testing.retry(3, async () => {
        const name = `sys-registry-404-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const res = await Npm.Fetch.Pkg.versions(name);
        expect(res.status).to.eql(404);
        expect(res.data).to.eql(undefined);
        expect(res.error?.name).to.eql('HttpError');
        expect(res.error?.cause?.message).to.include('404');
      });
    });
  });

  describe('Pkg.info( name, version )', () => {
    it('200 - success', async () => {
      await Testing.retry(3, async () => {
        const name = 'react';
        const version = '19.0.0';
        const res = await Npm.Fetch.Pkg.info(name, version);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);
        expect(res.data?.pkg).to.eql({ name, version });
        expect(typeof res.data?.dist?.tarball).to.eql('string');
      });
    });

    it('latest: version param omitted', async () => {
      await Testing.retry(3, async () => {
        const name = 'react';
        const latest = (await Npm.Fetch.Pkg.versions(name)).data?.latest;
        const res = await Npm.Fetch.Pkg.info(name);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);
        expect(res.data?.pkg).to.eql({ name, version: latest });
      });
    });
  });
});

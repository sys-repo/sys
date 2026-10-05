import { Hash } from '@sys/crypto/hash';
import { afterEach, beforeEach } from '@sys/testing/server';
import { DomMock, TestReact } from '@sys/ui-react/testing/server';
import { describe, expect, it, Json, Str, type t, Time, WebFixture } from '../-test.ts';
import { App } from '../ui/ui.App.tsx';

const ORIGIN = 'https://sample.test';
const PUBLIC_BASE = 'https://assets.test/nested/sample/ui/';
const PUBLIC_MANIFEST = `${PUBLIC_BASE}dist.json`;
const SRI_DOCS = 'https://www.w3.org/TR/2016/REC-SRI-20160623/';
const bundleSize = 551_353;
const privateDist: t.DistPkg = {
  type: 'https://jsr.io/@sample/r2',
  build: {
    time: 0,
    size: { total: 1_575, pkg: 0 },
    builder: '@sys/driver-vite',
    runtime: 'deno',
    hash: { policy: 'https://jsr.io/@sys/crypto' },
  },
  hash: {
    scheme: 'sys.dist/v2',
    digest: `sha256-${'a'.repeat(64)}`,
    parts: { 'index.html': `${Hash.sha256('fixture')}:size=7` },
  },
};
const publicDist: t.DistPkg = {
  ...privateDist,
  build: { ...privateDist.build, size: { total: bundleSize - 1_575, pkg: 0 } },
  hash: {
    scheme: 'sys.dist/v2',
    digest: `sha256-${'b'.repeat(64)}`,
    parts: { 'app.js': `${Hash.sha256('fixture')}:size=7` },
  },
};

describe('R2 deployment sample: UI rendering', () => {
  DomMock.init({ beforeEach, afterEach });

  it('pending → public-first rows with independent sizes, full digests, and separate document checksums', async () => {
    const privateResponse = Promise.withResolvers<Response>();
    const publicResponse = Promise.withResolvers<Response>();
    const bundle = Promise.withResolvers<Response>();
    const privateBytes = new TextEncoder().encode(`\uFEFF${Json.stringify(privateDist)}\n`);
    const publicBytes = new TextEncoder().encode(`  ${Json.stringify(publicDist)}\n`);
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const req = new Request(input, init);
      if (req.url === `${ORIGIN}/api/hello`) {
        return Promise.resolve(Response.json({ msg: 'hello' }));
      }
      if (req.url === `${ORIGIN}/ui/dist.json`) return privateResponse.promise;
      if (req.url === PUBLIC_MANIFEST) return publicResponse.promise;
      if (req.url === `${ORIGIN}/api/bundle`) return bundle.promise;
      throw new Error(`Unexpected fixture request: ${req.url}`);
    });
    const res = await TestReact.render(<App origin={ORIGIN} publicAssetBase={PUBLIC_BASE} />, {
      strict: false,
    });
    try {
      const section = res.container.querySelector('.content-summary');
      const regions = res.container.querySelectorAll('.manifest-table-scroll');
      expect(regions.length).to.eql(1);
      expect(regions[0].getAttribute('role')).to.eql('region');
      expect(regions[0].getAttribute('aria-label')).to.eql('Distribution content');
      expect(regions[0].getAttribute('tabindex')).to.eql('0');
      expect(section?.querySelector('h2')?.textContent).to.eql('Content');
      expect(section?.querySelector('header code')?.textContent).to.eql('scheme: sys.dist/v2');
      const tables = res.container.querySelectorAll('.identity-table');
      expect(tables.length).to.eql(1);
      const table = tables[0];
      expect(table.getAttribute('aria-labelledby')).to.eql(section?.querySelector('h2')?.id);
      const rows = table.querySelectorAll('tbody tr');
      const rowLabels = [...rows].map((row) => row.querySelector('th')?.textContent);
      expect(rowLabels).to.eql([
        'public',
        'private',
      ]);
      const rowScopes = [...rows].map((row) => row.querySelector('th')?.getAttribute('scope'));
      expect(rowScopes).to.eql([
        'row',
        'row',
      ]);
      const [publicRow, privateRow] = rows;
      const total = res.container.querySelector('.build-total');
      expect(total?.textContent).to.eql('Build size · Loading…');
      for (const row of rows) {
        expect(row.querySelector('td:nth-of-type(1)')?.textContent).to.eql('—');
        expect(row.querySelector('td:nth-of-type(2)')?.textContent).to.eql('Loading…');
      }
      const columnLabels = [...table.querySelectorAll('thead th')].map((cell) => cell.textContent);
      expect(columnLabels).to.eql([
        'Distribution',
        'Payload',
        'Content Digest (SHA-256)',
        'Manifest',
      ]);
      const manifestLinks = [...table.querySelectorAll('tbody a')];
      const manifestUrls = manifestLinks.map((link) => link.getAttribute('href'));
      expect(manifestUrls).to.eql([
        PUBLIC_MANIFEST,
        '/ui/dist.json',
      ]);
      const details = section?.querySelector('details');
      if (!details) throw new Error('Expected the manifest document checksum disclosure.');
      expect(section?.querySelectorAll('details').length).to.eql(1);
      expect(details.hasAttribute('open')).to.eql(false);
      expect(details.querySelector('summary')?.textContent).to.eql('Manifest document checksums');
      const checksumLabels = [...details.querySelectorAll('dt')].map((el) => el.textContent);
      expect(checksumLabels).to.eql(['public ↗', 'private']);
      const checksumLinks = [...details.querySelectorAll('dt a')];
      expect(checksumLinks.map((link) => link.getAttribute('href'))).to.eql([
        PUBLIC_MANIFEST,
        '/ui/dist.json',
      ]);
      expect(details.querySelectorAll('a').length).to.eql(2);
      expect(details.querySelector('p a')).to.eql(null);
      expect(details.querySelector('dd a')).to.eql(null);
      const pendingChecksums = [...details.querySelectorAll('dd')].map((el) => el.textContent);
      expect(pendingChecksums).to.eql([
        'Loading…',
        'Loading…',
      ]);
      expect(res.container.querySelector('h1')?.textContent).to.eql('@sample');
      expect(res.container.querySelector('h2')?.textContent).to.eql(
        'Application server: HTML + API · Public R2: assets',
      );
      expect(res.container.querySelector('p')?.textContent).to.eql(
        'A thin, Web Standards–based application server handles the HTML entry point and /api at the application origin (sample.test). JavaScript, CSS, images, and other static assets load directly from public R2 ↗, avoiding application-server egress for those assets. Browsers verify HTML-linked scripts and styles using Subresource Integrity (SRI) ↗.',
      );
      const sriDocs = res.container.querySelector(`a[href="${SRI_DOCS}"]`);
      expect(sriDocs?.textContent).to.eql('Subresource Integrity (SRI) ↗');

      // Public completes first: the private row must retain its loading state.
      await TestReact.act(async () => {
        publicResponse.resolve(new Response(publicBytes));
        await Time.wait(0);
      });
      expect(publicRow.querySelector('td')?.textContent).to.eql(
        Str.bytes(publicDist.build.size.total),
      );
      expect(publicRow.querySelector('td:nth-of-type(2)')?.textContent).to.eql(
        'bbbbbbbbbbbb…bbbbb',
      );
      expect(privateRow.querySelector('td')?.textContent).to.eql('—');
      expect(privateRow.querySelector('td:nth-of-type(2)')?.textContent).to.eql('Loading…');
      expect(total?.textContent).to.eql('Build size · Loading…');

      await TestReact.act(async () => {
        privateResponse.resolve(new Response(privateBytes));
        bundle.resolve(Response.json({ size: bundleSize }));
        await Time.wait(0);
      });
      expect(total?.textContent).to.eql(`Build size · ${Str.bytes(bundleSize)}`);
      expect(privateRow.querySelector('td:nth-of-type(2)')?.textContent).to.eql(
        'aaaaaaaaaaaa…aaaaa',
      );
      const groups = [
        { row: publicRow, href: PUBLIC_MANIFEST, dist: publicDist },
        { row: privateRow, href: '/ui/dist.json', dist: privateDist },
      ];
      for (const { row, href, dist } of groups) {
        const links = [...row.querySelectorAll('a')].map((link) => link.getAttribute('href'));
        expect(links).to.eql([href]);
        expect(row.querySelector('td:nth-of-type(2) a')).to.eql(null);
        expect(row.querySelector('td')?.textContent).to.eql(Str.bytes(dist.build.size.total));
        expect(row.querySelector('td:nth-of-type(2) code')?.getAttribute('title')).to.eql(
          `sys.dist/v2 ${dist.hash.digest}`,
        );
      }
      for (const link of res.container.querySelectorAll('a')) {
        const href = link.getAttribute('href');
        if (!href) throw new Error('Expected a link destination.');
        const external = new URL(href, ORIGIN).origin !== new URL(ORIGIN).origin;
        expect(link.textContent?.endsWith(' ↗'), href).to.eql(external);
        expect(link.hasAttribute('target'), href).to.eql(false);
      }
      const documentChecksums = [...details.querySelectorAll('dd code')].map((el) => {
        return el.textContent;
      });
      expect(documentChecksums).to.eql([
        Hash.sha256(publicBytes, { prefix: false }),
        Hash.sha256(privateBytes, { prefix: false }),
      ]);
      expect(details.querySelector('p')?.innerHTML).to.eql(
        'SHA-256 of each fetched <code>dist.json</code> file<br>not the distribution’s content hash stored in <code>hash.digest</code>.',
      );
      expect([...details.querySelectorAll('p code')].map((el) => el.textContent)).to.eql([
        'dist.json',
        'hash.digest',
      ]);
      expect(section?.querySelector('.manifest-table-scroll + p')?.textContent).to.eql(
        'Digests are abbreviated. These values are manifest reports, not payload verification. Open each manifest and compare its full hash.scheme and hash.digest with the corresponding pin in dist.pins.json.',
      );
      expect(section?.textContent).not.to.include('not verified by this page');
      expect(section?.textContent).not.to.include('(diagnostic)');
      expect(section?.textContent).not.to.include('observations');
    } finally {
      res.dispose();
      privateResponse.resolve(new Response(null, { status: 204 }));
      publicResponse.resolve(new Response(null, { status: 204 }));
      bundle.resolve(new Response(null, { status: 204 }));
      await Time.wait(0);
    }
  });

  for (const failed of ['private', 'public'] as const) {
    it(`failed ${failed} manifest → explicit row error, retained links, and unaffected sibling`, async () => {
      using _mock = WebFixture.Fetch.mock((input, init) => {
        const req = new Request(input, init);
        if (req.url === `${ORIGIN}/api/hello`) {
          return Promise.resolve(Response.json({ msg: 'hello' }));
        }
        if (req.url === `${ORIGIN}/api/bundle`) {
          return Promise.resolve(new Response(null, { status: 404 }));
        }
        if (req.url === `${ORIGIN}/ui/dist.json` || req.url === PUBLIC_MANIFEST) {
          const audience = req.url === PUBLIC_MANIFEST ? 'public' : 'private';
          return Promise.resolve(
            audience === failed
              ? new Response(null, { status: 404 })
              : Response.json(audience === 'private' ? privateDist : publicDist),
          );
        }
        throw new Error(`Unexpected fixture request: ${req.url}`);
      });
      const res = await TestReact.render(<App origin={ORIGIN} publicAssetBase={PUBLIC_BASE} />, {
        strict: false,
      });
      try {
        await TestReact.act(async () => {
          await Time.wait(0);
        });
        const rows = res.container.querySelectorAll('.identity-table tbody tr');
        expect(rows.length).to.eql(2);
        const failedRow = rows[failed === 'public' ? 0 : 1];
        const otherRow = rows[failed === 'public' ? 1 : 0];
        expect(failedRow.querySelector('th')?.textContent).to.eql(failed);
        expect(failedRow.querySelector('td')?.textContent).to.eql('—');
        expect(failedRow.querySelector('td:nth-of-type(2)')?.textContent).to.eql(
          `Could not load the ${failed} manifest.`,
        );
        expect(failedRow.querySelector('a')?.getAttribute('href')).to.eql(
          failed === 'public' ? PUBLIC_MANIFEST : '/ui/dist.json',
        );
        expect(otherRow.querySelector('td:nth-of-type(2) code')?.getAttribute('title')).to.eql(
          `sys.dist/v2 ${failed === 'private' ? publicDist.hash.digest : privateDist.hash.digest}`,
        );
        const checksumLinks = [...res.container.querySelectorAll('.manifest-checksums dt a')];
        expect(checksumLinks.map((link) => link.getAttribute('href'))).to.eql([
          PUBLIC_MANIFEST,
          '/ui/dist.json',
        ]);
        const checksums = res.container.querySelectorAll('.manifest-checksums dd');
        expect(checksums[failed === 'public' ? 0 : 1]?.textContent).to.eql(
          `Could not load the ${failed} manifest.`,
        );
        expect(res.container.querySelector('.build-total')?.textContent).to.eql(
          'Build size · Could not load bundle size.',
        );
        expect(res.container.querySelector('a[href="/api/hello"]')?.textContent).to.eql('/api');
        expect(res.container.textContent).to.include('api.msg: "hello"');
      } finally {
        res.dispose();
        await Time.wait(0);
      }
    });
  }

  it('zero-byte payload and total → zero stays visible rather than becoming unavailable', async () => {
    const empty = { ...privateDist, build: { ...privateDist.build, size: { total: 0, pkg: 0 } } };
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const req = new Request(input, init);
      if (req.url === `${ORIGIN}/api/hello`) {
        return Promise.resolve(Response.json({ msg: 'hello' }));
      }
      if (req.url === `${ORIGIN}/api/bundle`) return Promise.resolve(Response.json({ size: 0 }));
      return Promise.resolve(Response.json(empty));
    });
    const res = await TestReact.render(<App origin={ORIGIN} publicAssetBase={PUBLIC_BASE} />, {
      strict: false,
    });
    try {
      await TestReact.act(async () => {
        await Time.wait(0);
      });
      const sizes = res.container.querySelectorAll('.identity-table tbody td:first-of-type');
      const payloadSizes = [...sizes].map((cell) => cell.textContent);
      expect(payloadSizes).to.eql([Str.bytes(0), Str.bytes(0)]);
      expect(res.container.querySelector('.build-total')?.textContent).to.eql(
        `Build size · ${Str.bytes(0)}`,
      );
    } finally {
      res.dispose();
      await Time.wait(0);
    }
  });

  it('absent origin → prose has no empty annotation', async () => {
    const res = await TestReact.render(<App origin='' publicAssetBase={PUBLIC_BASE} />, {
      strict: false,
    });
    try {
      expect(res.container.querySelector('p')?.textContent).to.include(
        'at the application origin. JavaScript, CSS, images, and other static assets',
      );
      expect(res.container.querySelector(`a[href="${SRI_DOCS}"]`)?.textContent).to.eql(
        'Subresource Integrity (SRI) ↗',
      );
    } finally {
      res.dispose();
      await Time.wait(0);
    }
  });
});

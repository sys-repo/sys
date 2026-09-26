import { Hash } from '@sys/crypto/hash';
import { afterEach, beforeEach } from '@sys/testing/server';
import { DomMock, TestReact } from '@sys/ui-react/testing/server';
import { describe, expect, it, Json, Str, type t, Time, WebFixture } from '../-test.ts';
import { App } from '../ui/ui.App.tsx';

const ORIGIN = 'https://sample.test';
const PUBLIC_BASE = 'https://assets.test/nested/sample/ui/';
const PUBLIC_MANIFEST = `${PUBLIC_BASE}dist.json`;
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
  hash: { digest: `sha256-${'a'.repeat(64)}`, parts: {} },
};
const publicDist: t.DistPkg = {
  ...privateDist,
  build: { ...privateDist.build, size: { total: bundleSize - 1_575, pkg: 0 } },
  hash: { digest: `sha256-${'b'.repeat(64)}`, parts: {} },
};

describe('R2 deployment sample: UI rendering', () => {
  DomMock.init({ beforeEach, afterEach });

  it('pending → two matching groups with independent payload sizes and a separate bundle total', async () => {
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
      const regions = res.container.querySelectorAll('.manifest-table-scroll');
      expect([...regions].map((region) => region.getAttribute('aria-label'))).to.eql([
        'private manifest hashes',
        'public manifest hashes',
      ]);
      for (const region of regions) {
        expect(region.getAttribute('role')).to.eql('region');
        expect(region.getAttribute('tabindex')).to.eql('0');
        expect(region.querySelectorAll('table').length).to.eql(1);
      }
      const tables = res.container.querySelectorAll('.identity-table');
      expect(tables.length).to.eql(2);
      const privateCaption = tables[0].querySelector('caption');
      const publicCaption = tables[1].querySelector('caption');
      const total = res.container.querySelector('.bundle-size');
      expect(privateCaption?.textContent).to.eql('private relay — /ui/dist.json');
      expect(publicCaption?.textContent).to.eql('public R2 — dist.json ↗');
      expect(total?.textContent).to.eql('total bundle • Loading…');
      expect(res.container.querySelector('p')?.textContent).to.include(
        'from the application origin (sample.test). UI scripts, styles, and images load directly from public R2',
      );
      for (const table of tables) {
        expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).to.eql([
          'What',
          'SHA-256',
          'Compare locally',
        ]);
        expect(table.querySelectorAll('tbody tr').length).to.eql(2);
        expect(table.querySelector('caption code')).to.eql(null);
      }

      // Public completes first: the private group must retain its loading state.
      await TestReact.act(async () => {
        publicResponse.resolve(new Response(publicBytes));
        await Time.wait(0);
      });
      expect(publicCaption?.textContent).to.eql(
        `public R2 — dist.json ↗ • #bbbbb • ${Str.bytes(publicDist.build.size.total)}`,
      );
      expect(privateCaption?.textContent).to.eql('private relay — /ui/dist.json');
      expect(tables[0].querySelector('tbody td')?.textContent).to.eql('Loading…');
      expect(total?.textContent).to.eql('total bundle • Loading…');

      await TestReact.act(async () => {
        privateResponse.resolve(new Response(privateBytes));
        bundle.resolve(Response.json({ size: bundleSize }));
        await Time.wait(0);
      });
      expect(privateCaption?.textContent).to.eql(
        `private relay — /ui/dist.json • #aaaaa • ${Str.bytes(privateDist.build.size.total)}`,
      );
      expect(total?.textContent).to.eql(`total bundle • ${Str.bytes(bundleSize)}`);
      const groups = [
        { table: tables[0], href: '/ui/dist.json', dist: privateDist, bytes: privateBytes },
        { table: tables[1], href: PUBLIC_MANIFEST, dist: publicDist, bytes: publicBytes },
      ];
      for (const { table, href, dist, bytes } of groups) {
        const links = [...table.querySelectorAll('a')].map((link) => link.getAttribute('href'));
        expect(links).to.eql([href, href, href]);
        expect(table.querySelector('tbody td a')?.getAttribute('title')).to.eql(dist.hash.digest);
        expect(table.querySelector('tbody tr:nth-child(2) td code')?.getAttribute('title'))
          .to.eql(Hash.sha256(bytes));
        expect(table.querySelector('caption span')?.getAttribute('title')).to.eql(
          'Distribution payload size',
        );
        expect(table.querySelector('caption')?.textContent).not.to.include(Str.bytes(bundleSize));
        expect(table.querySelector('caption')?.textContent).not.to.include(
          Str.bytes(bytes.byteLength),
        );
      }
      expect(tables[0].querySelector('tbody tr:first-child td:last-child')?.textContent).to.eql(
        'deno task serve → shell',
      );
      expect(tables[1].querySelector('tbody tr:first-child td:last-child')?.textContent).to.eql(
        'dist.public/dist.json',
      );
      for (const [index, audience] of ['private', 'public'].entries()) {
        const cell = tables[index].querySelector('tbody tr:last-child td:last-child');
        expect(cell?.textContent).to.eql(`deno task build → ${audience}:`);
      }
    } finally {
      res.dispose();
      privateResponse.resolve(new Response(null, { status: 204 }));
      publicResponse.resolve(new Response(null, { status: 204 }));
      bundle.resolve(new Response(null, { status: 204 }));
      await Time.wait(0);
    }
  });

  for (const failed of ['private', 'public'] as const) {
    it(`failed ${failed} manifest → quiet caption, explicit error, and unaffected sibling`, async () => {
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
        const tables = res.container.querySelectorAll('.identity-table');
        const failedTable = tables[failed === 'private' ? 0 : 1];
        const otherTable = tables[failed === 'private' ? 1 : 0];
        expect(failedTable.querySelector('caption')?.textContent).to.eql(
          failed === 'private' ? 'private relay — /ui/dist.json' : 'public R2 — dist.json ↗',
        );
        const cells = failedTable.querySelectorAll('tbody td:first-of-type');
        expect([...cells].map((cell) => cell.textContent)).to.eql([
          `Could not load the ${failed} manifest.`,
          `Could not load the ${failed} manifest.`,
        ]);
        expect(otherTable.querySelector('caption code')?.textContent).to.eql(
          failed === 'private' ? '#bbbbb' : '#aaaaa',
        );
        expect(res.container.querySelector('.bundle-size')?.textContent).to.eql(
          'total bundle • Could not load bundle size.',
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
      for (const caption of res.container.querySelectorAll('caption')) {
        expect(caption.textContent).to.include(` • ${Str.bytes(0)}`);
      }
      expect(res.container.querySelector('.bundle-size')?.textContent).to.eql(
        `total bundle • ${Str.bytes(0)}`,
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
        'from the application origin. UI scripts',
      );
    } finally {
      res.dispose();
      await Time.wait(0);
    }
  });
});

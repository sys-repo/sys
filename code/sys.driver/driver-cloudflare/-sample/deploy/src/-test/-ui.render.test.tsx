import { Hash } from '@sys/crypto/hash';
import { afterEach, beforeEach } from '@sys/testing/server';
import { DomMock, TestReact } from '@sys/ui-react/testing/server';
import { describe, expect, it, Json, Str, type t, Time, WebFixture } from '../-test.ts';
import { App } from '../ui/ui.App.tsx';

const ORIGIN = 'https://sample.test';
const digest = `sha256-${'a'.repeat(64)}`;
const dist: t.DistPkg = {
  type: 'https://jsr.io/@sample/r2',
  build: {
    time: 0,
    size: { total: 551_000, pkg: 551_000 },
    builder: '@sys/driver-vite',
    runtime: 'deno',
    hash: { policy: 'https://jsr.io/@sys/crypto' },
  },
  hash: { digest, parts: {} },
};

describe('R2 deployment sample: UI rendering', () => {
  DomMock.init({ beforeEach, afterEach });

  it('pending → loaded caption preserves path, file size, bullet separators, and digest order', async () => {
    const manifest = Promise.withResolvers<Response>();
    const bytes = new TextEncoder().encode(`\uFEFF${Json.stringify(dist)}\n`);
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const req = new Request(input, init);
      if (req.url === `${ORIGIN}/api/hello`) {
        return Promise.resolve(Response.json({ msg: 'hello' }));
      }
      if (req.url === `${ORIGIN}/ui/dist.json`) return manifest.promise;
      throw new Error(`Unexpected fixture request: ${req.url}`);
    });
    const res = await TestReact.render(<App origin={ORIGIN} />, { strict: false });
    try {
      const caption = res.container.querySelector('caption');
      expect(caption?.textContent).to.eql('Private relay — /ui/dist.json');
      expect(caption?.querySelector('code')).to.eql(null);
      expect(res.container.querySelector('p')?.textContent).to.include(
        'from the application origin (sample.test). UI scripts',
      );

      await TestReact.act(async () => {
        manifest.resolve(new Response(bytes));
        await Time.wait(0);
      });

      expect(caption?.textContent).to.eql(
        `Private relay — /ui/dist.json • ${Str.bytes(bytes.byteLength)} • #aaaaa`,
      );
      expect(caption?.querySelector('a')?.getAttribute('href')).to.eql('/ui/dist.json');
      expect(caption?.querySelector('code')?.textContent).to.eql('#aaaaa');
      expect(res.container.querySelector('tbody td a')?.getAttribute('title')).to.eql(digest);
      expect(res.container.querySelector('tbody tr:nth-child(2) td code')?.getAttribute('title'))
        .to.eql(Hash.sha256(bytes));
    } finally {
      res.dispose();
      manifest.resolve(new Response(null, { status: 204 }));
      await Time.wait(0);
    }
  });

  it('failed manifest → caption has no size, digest, or dangling separator', async () => {
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const req = new Request(input, init);
      if (req.url === `${ORIGIN}/api/hello`) {
        return Promise.resolve(Response.json({ msg: 'hello' }));
      }
      if (req.url === `${ORIGIN}/ui/dist.json`) {
        return Promise.resolve(new Response(null, { status: 404 }));
      }
      throw new Error(`Unexpected fixture request: ${req.url}`);
    });
    const res = await TestReact.render(<App origin={ORIGIN} />, { strict: false });
    try {
      await TestReact.act(async () => {
        await Time.wait(0);
      });
      expect(res.container.querySelector('caption')?.textContent).to.eql(
        'Private relay — /ui/dist.json',
      );
      const cells = res.container.querySelectorAll('tbody tr td:first-of-type');
      expect([...cells].map((cell) => cell.textContent)).to.eql([
        'Could not load the private manifest.',
        'Could not load the private manifest.',
      ]);
    } finally {
      res.dispose();
      await Time.wait(0);
    }
  });

  it('absent origin → prose has no empty annotation', async () => {
    const res = await TestReact.render(<App origin='' />, { strict: false });
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

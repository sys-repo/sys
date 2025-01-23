import { type t, Cli, c, Testing, describe, expect, it } from '../../-test.ts';

import { Hash } from '@sys/crypto/hash';
import { Http } from '../mod.ts';
import { rx } from './common.ts';
import { Fetch } from './mod.ts';

describe('Http.Fetch', () => {
  it('API', () => {
    expect(Http.Fetch).to.equal(Fetch);
  });

  describe('Fetch.disposable', () => {
    describe('success', () => {
      it('200: json', async () => {
        const life = rx.disposable();
        const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
        const url = server.url.base;
        const fetch = Fetch.disposable(life.dispose$);
        expect(fetch.disposed).to.eql(false);

        const res = await fetch.json(url);
        expect(res.ok).to.eql(true);
        expect(res.status).to.eql(200);
        expect(res.url).to.eql(url);
        expect(res.data).to.eql({ foo: 123 });
        expect(res.error).to.eql(undefined);
        expect(res.headers.get('content-type')).to.eql('application/json');

        expect(fetch.disposed).to.eql(false);
        await server.dispose();
      });

      it('200: text', async () => {
        const life = rx.disposable();
        const text = 'foo-👋';
        const server = Testing.Http.server(() => Testing.Http.text(text));
        const url = server.url.base;
        const fetch = Fetch.disposable(life.dispose$);
        expect(fetch.disposed).to.eql(false);

        const res = await fetch.text(url);

        expect(res.ok).to.eql(true);
        expect(res.status).to.eql(200);
        expect(res.url).to.eql(url);
        expect(res.data).to.eql(text);
        expect(res.error).to.eql(undefined);

        expect(fetch.disposed).to.eql(false);
        await server.dispose();
      });
    });

    describe('fail', () => {
      it('404: error with headers', async () => {
        const life = rx.disposable();
        const server = Testing.Http.server(() => Testing.Http.error(404, 'Not Found'));
        const fetch = Fetch.disposable(life.dispose$);

        const url = server.url.base;
        const headers = { foo: 'bar' };
        const res = await fetch.json(url, { headers });
        expect(res.ok).to.eql(false);
        expect(res.status).to.eql(404);
        expect(res.url).to.eql(url);
        expect(res.data).to.eql(undefined);

        expect(res.error?.name).to.eql('HttpError');
        expect(res.error?.message).to.include('HTTP/GET request failed');
        expect(res.error?.cause?.message).to.include('404 Not Found');
        expect(res.error?.headers).to.eql({ foo: 'bar' });

        await server.dispose();
      });

      it('520: client error (JSON parse failure)', async () => {
        const server = Testing.Http.server(() => Testing.Http.text('hello'));
        const fetch = Fetch.disposable();

        const url = server.url.base;
        const res = await fetch.json(url);

        expect(res.status).to.eql(520);
        expect(res.error?.name).to.eql('HttpError');
        expect(res.error?.message).to.include('HTTP/GET request failed');
        expect(res.error?.cause?.message).to.include('Failed while fetching');
        expect(res.error?.cause?.cause?.message).to.include('is not valid JSON');

        await server.dispose();
      });
    });

    describe('dispose', () => {
      it('dispose$ ← (observable param)', async () => {
        const life = rx.disposable();
        const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
        const url = server.url.base;
        const fetch = Fetch.disposable(life.dispose$);
        expect(fetch.disposed).to.eql(false);

        const promise = fetch.json(url);
        life.dispose();
        const res = await promise;

        expect(res.ok).to.eql(false);
        expect(res.status).to.eql(499);
        expect(res.url).to.eql(url);
        expect(res.data).to.eql(undefined);

        const error = res.error;
        expect(error?.name).to.eql('HttpError');
        expect(error?.cause?.message).to.include('Fetch operation disposed before completing (499');

        expect(fetch.disposed).to.eql(true);
        await server.dispose();
      });

      it('fetch.dispose', async () => {
        const life = rx.disposable();
        const fetch = Fetch.disposable(life.dispose$);

        const fired = { life: 0, fetch: 0 };
        life.dispose$.subscribe(() => fired.life++);
        fetch.dispose$.subscribe(() => fired.fetch++);

        expect(fetch.disposed).to.eql(false);
        fetch.dispose();
        expect(fetch.disposed).to.eql(true);

        expect(fired.life).to.eql(0);
        expect(fired.fetch).to.eql(1);
      });
    });

    describe('checksum', () => {
      const print = (res: t.FetchResponse<unknown>) => {
        const table = Cli.table([]);

        table.push([c.cyan(' status:'), c.bold(String(res.status))]);
        table.push([c.cyan(' url:'), c.green(res.url)]);
        table.push([c.cyan(' hash (expected):'), res.checksum?.expected]);
        table.push([c.cyan(' hash (actual):'), res.checksum?.actual]);
        table.push([c.cyan(' data:')]);

        console.info();
        console.info(table.toString().trim());
        console.info();
        console.info(c.italic(c.yellow(String(res.data ?? '(empty)'))));
        console.info();
        console.info(res.error?.cause);
        console.info();
      };

      const assertSuccess = (res: t.FetchResponse<unknown>) => {
        expect(res.ok).to.eql(true);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);
      };

      const assertFail = (res: t.FetchResponse<unknown>) => {
        const error = res.error?.cause;
        expect(res.ok).to.eql(false);
        expect(res.status).to.eql(412);
        expect(error?.message).to.include(`412:Pre-condition failed (checksum-mismatch)`);
        expect(error?.message).to.include(`does not match the expected checksum: "sha256-FAIL"`);
        expect(error?.message).to.include(res.checksum?.actual);
      };

      it('text: { checksum }', async () => {
        const life = rx.disposable();
        const text = 'sample-🌳';
        const server = Testing.Http.server(() => Testing.Http.text(text));
        const url = server.url.base;
        const fetch = Fetch.disposable(life.dispose$);

        const checksum = Hash.sha256(text);
        const resA = await fetch.text(url, {}, {});
        const resB = await fetch.text(url, {}, { checksum: 'sha256-FAIL' });
        const resC = await fetch.text(url, {}, { checksum });

        assertSuccess(resA);
        assertFail(resB);
        assertSuccess(resC);

        expect(resA.checksum).to.eql(undefined);
        expect(resC.checksum).to.eql({ valid: true, expected: checksum, actual: checksum });

        print(resB);

        await server.dispose();
      });
    });
  });
});

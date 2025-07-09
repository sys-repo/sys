import { type t, describe, Err, expect, it, Url } from '../../-test.ts';
import { Cache } from '../m.Http.Cache/mod.ts';
import { Fetch } from '../m.Http.Fetch/mod.ts';
import { Http } from './mod.ts';

describe('Http', () => {
  it('API', () => {
    expect(Http.Url).to.equal(Url);
    expect(Http.url).to.equal(Url.parse);
    expect(Http.Fetch).to.equal(Fetch);
    expect(Http.fetch).to.equal(Fetch.create);
    expect(Http.Cache).to.equal(Cache);
  });

  describe('Http.toError', () => {
    it('404: Not found', () => {
      const res = new Response('Not Found', { status: 404, statusText: 'Not Found' });
      const err = Http.toError(res);
      expect(Err.Is.stdError(err)).to.eql(true);

      expect(err?.status).to.eql(404);
      expect(err?.statusText).to.eql('Not Found');
      expect(err?.message).to.eql(`404 Not Found`);
      expect(err?.headers).to.eql({ 'content-type': 'text/plain;charset=UTF-8' });
    });

    it('Default message (no status text)', () => {
      const res = new Response('Not Found', { status: 500 });
      const err = Http.toError(res);
      expect(Err.Is.stdError(err)).to.eql(true);

      expect(err?.message).to.eql(`500 HTTP Error`);
      expect(err?.status).to.eql(500);
      expect(err?.statusText).to.eql('');
    });

    it('No error: 200 → <undefined>', () => {
      const res = new Response('Not Found', { status: 200 });
      expect(Http.toError(res)).to.eql(undefined);
    });
  });

  describe('Http.toResponse', () => {
    type T = { count: number };

    it('toResponse: data', async () => {
      const obj = { count: 123 };
      const input = new Response(JSON.stringify(obj));
      const res = await Http.toResponse<T>(input);
      expect(res.ok).to.eql(true);
      expect(res.data).to.eql(obj);
      expect(res.error).to.eql(undefined);
    });

    it('toResponse: error', async () => {
      const input = new Response('Not Found', { status: 404, statusText: 'foo' });
      const res = await Http.toResponse(input);
      expect(res.ok).to.eql(false);
      expect(res.data).to.eql(undefined);
      expect(res.error?.status).to.eql(404);
      expect(res.error?.statusText).to.eql('foo');
      expect(res.error?.message).to.eql('404 foo');
      expect(res.error?.headers).to.eql({ 'content-type': 'text/plain;charset=UTF-8' });
    });
  });

  describe('Http.toHeaders', () => {
    it('undefined → {}', () => {
      expect(Http.toHeaders()).to.eql({});
    });

    it('{HttpHeaders} record → no change', () => {
      const headers: t.HttpHeaders = { 'content-type': 'application/json', pkg: 'name@1.2.3' };
      expect(Http.toHeaders(headers)).to.equal(headers);
    });

    it('from [Headers] object', () => {
      const input = new Headers();
      input.set('x-foo', 'foo');
      expect(Http.toHeaders(input)).to.eql({ 'x-foo': 'foo' });
      expect(Http.toHeaders(new Headers())).to.eql({});
    });

    it('from [string, string][] array', () => {
      const a = Http.toHeaders([]);
      const b = Http.toHeaders([
        ['foo', 'xyz'],
        ['bar', '123'],
      ]);
      expect(a).to.eql({});
      expect(b).to.eql({ foo: 'xyz', bar: '123' });
    });
  });

  describe('Http.toUint8Array', () => {
    it('empty Uint8Array when input is undefined', async () => {
      const result = await Http.toUint8Array(undefined);
      expect(result).to.be.instanceOf(Uint8Array);
      expect(result.length).to.eql(0);
    });

    it('converts Blob to Uint8Array correctly', async () => {
      const data = new TextEncoder().encode('hello');
      const blob = new Blob([data]);
      const result = await Http.toUint8Array(blob);
      expect(result).to.be.instanceOf(Uint8Array);
      expect(Array.from(result)).to.eql(Array.from(data));
    });
  });
});

import { describe, expect, it } from '../-test.ts';
import { Err } from '../m.Err/mod.ts';
import { Http } from './mod.ts';

describe('Http', () => {
  it('Http.toHeaders', () => {
    const input = new Headers();
    input.set('x-foo', 'foo');
    expect(Http.toHeaders(input)).to.eql({ 'x-foo': 'foo' });
    expect(Http.toHeaders(new Headers())).to.eql({});
  });

  describe('Http.toError', () => {
    it('404: Not found', () => {
      const res = new Response('Not Found', { status: 404, statusText: 'Not Found' });
      const err = Http.toError(res);
      expect(Err.Is.stdError(err)).to.eql(true);

      expect(err?.message).to.eql(`404 Not Found`);
      expect(err?.status).to.eql(404);
      expect(err?.statusText).to.eql('Not Found');
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
});

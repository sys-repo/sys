import { describe, expect, it } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';
import { NS, options, optionsWithoutCtxHandler, request, result } from './u.fixture.ts';

describe('HttpCmd.handle', () => {
  it('handles one Request and passes typed command context', async () => {
    const response = await HttpCmd.handle(
      request({ id: 'req-context', name: 'fixture.ctx', payload: {} }),
      options(),
    );
    const msg = await result(response);

    expect(response.status).to.eql(200);
    expect(msg.payload).to.eql({
      id: 'req-context',
      name: 'fixture.ctx',
      ns: NS,
      aborted: false,
    });
  });

  it('returns Cmd result errors for handler failures', async () => {
    const response = await HttpCmd.handle(
      request({ name: 'fixture.fail', payload: { message: 'boom' } }),
      options(),
    );
    const msg = await result(response);

    expect(response.status).to.eql(500);
    expect(msg.payload).to.eql(undefined);
    expect(msg.error).to.eql('HTTP command failed.');
  });

  it('returns Cmd result errors for missing handlers', async () => {
    const opts = optionsWithoutCtxHandler();

    const response = await HttpCmd.handle(
      request({ name: 'fixture.ctx', payload: {} }),
      opts,
    );
    const msg = await result(response);

    expect(response.status).to.eql(404);
    expect(msg.error).to.eql('HTTP command failed.');
  });

  it('keeps unary HTTP JSON honest by ignoring emitted events', async () => {
    const response = await HttpCmd.handle(
      request({ name: 'fixture.emit', payload: { text: 'event' } }),
      options(),
    );
    const msg = await result(response);

    expect(response.status).to.eql(200);
    expect(msg.payload).to.eql({ ok: true });
    expect(msg.error).to.eql(undefined);
  });

  it('rejects malformed JSON with 400', async () => {
    const response = await HttpCmd.handle(
      request({}, { body: '{' }),
      options(),
    );

    expect(response.status).to.eql(400);
    expect(await response.text()).to.eql('');
  });

  it('rejects non-Cmd JSON with 400', async () => {
    const response = await HttpCmd.handle(
      request({}, { body: { ok: true } }),
      options(),
    );

    expect(response.status).to.eql(400);
    expect(await response.text()).to.eql('');
  });

  it('rejects non-POST methods with 405', async () => {
    const response = await HttpCmd.handle(
      request({}, { method: 'GET' }),
      options(),
    );

    expect(response.status).to.eql(405);
    expect(response.headers.get('allow')).to.eql('POST');
  });

  it('isolates route paths with 404', async () => {
    const response = await HttpCmd.handle(
      request({}, { url: 'https://example.test/wrong' }),
      options(),
    );

    expect(response.status).to.eql(404);
    expect(await response.text()).to.eql('');
  });

  it('isolates namespaces with 404', async () => {
    const response = await HttpCmd.handle(
      request({ ns: 'other.namespace' }),
      options(),
    );

    expect(response.status).to.eql(404);
    expect(await response.text()).to.eql('');
  });
});

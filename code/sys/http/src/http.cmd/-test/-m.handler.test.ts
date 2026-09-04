import { describe, expect, it } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';
import { NS, options, request, result } from './u.fixture.ts';

describe('HttpCmd.handler', () => {
  it('creates a Fetch-compatible unary Cmd request handler', async () => {
    const handler = HttpCmd.handler(options());

    const response = await handler(
      request({ payload: { text: 'hello', suffix: ' world' } }),
    );
    const msg = await result(response);

    expect(response.status).to.eql(200);
    expect(msg.kind).to.eql('cmd:result');
    expect(msg.ns).to.eql(NS);
    expect(msg.name).to.eql('fixture.echo');
    expect(msg.payload).to.eql({ text: 'hello world' });
    expect(msg.error).to.eql(undefined);
  });

  it('accepts all route paths when no path is configured', async () => {
    const handler = HttpCmd.handler(options({ path: undefined }));
    const response = await handler(
      request({}, { url: 'https://example.test/another/path' }),
    );
    const msg = await result(response);

    expect(response.status).to.eql(200);
    expect(msg.payload).to.eql({ text: 'hello' });
  });
});

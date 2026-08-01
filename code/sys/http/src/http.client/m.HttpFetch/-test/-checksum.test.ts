import { Hash } from '@sys/crypto/hash';
import { describe, expect, it, type t, Testing } from '../../../-test.ts';

import { Fetch } from '../mod.ts';
import { print } from './-u.ts';

describe('Http.Fetch: hash checksums', () => {
  const assertSuccess = (res: t.FetchResponse<unknown>) => {
    expect(res.ok).to.eql(true);
    expect(res.status).to.eql(200);
    expect(res.error).to.eql(undefined);
  };

  const assertFail = (res: t.FetchResponse<unknown>) => {
    const error = res.error?.cause;
    expect(res.ok).to.eql(false);
    expect(res.status).to.eql(412);
    expect(res.statusText).to.eql('Pre-condition failed (checksum-mismatch)');
    expect(res.data).to.eql(undefined);
    expect(error?.message).to.include(`412: Pre-condition failed (checksum-mismatch)`);
    expect(error?.message).to.include(`does not match the expected checksum:`);
    expect(error?.message).to.include(res.checksum?.actual);
    expect(error?.message).to.include(res.checksum?.expected);
  };

  it('text: { checksum }', async () => {
    const text = 'text-🌳';
    const server = Testing.Http.server(() => Testing.Http.text(text));
    const url = server.url.raw;
    const fetch = Fetch.make();

    const checksum = Hash.sha256(text);
    const resA = await fetch.text(url); // NB: "control" (defaults).
    const resB = await fetch.text(url, {}, { checksum: 'sha256-FAIL' });
    const resC = await fetch.text(url, {}, { checksum });
    print(resB);

    assertSuccess(resA);
    assertFail(resB);
    assertSuccess(resC);

    expect(resA.checksum).to.eql(undefined);
    expect(resC.checksum).to.eql({ valid: true, expected: checksum, actual: checksum });

    fetch.dispose();
    await server.dispose();
  });

  it('json: { checksum }', async () => {
    const json = { foo: 123 };
    const server = Testing.Http.server(() => Testing.Http.json(json));
    const url = server.url.toString();
    const fetch = Fetch.make();

    const checksum = Hash.sha256(json);
    const resA = await fetch.json(url); // NB: "control" (defaults).
    const resB = await fetch.json(url, {}, { checksum: 'sha256-FAIL' });
    const resC = await fetch.json(url, {}, { checksum });
    print(resB);

    assertSuccess(resA);
    assertFail(resB);
    assertSuccess(resC);

    fetch.dispose();
    await server.dispose();
  });

  it('blob: { checksum } hashes exact response bytes', async () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    const server = Testing.Http.server(() => Testing.Http.blob(bytes));
    const url = server.url.toString();
    const fetch = Fetch.make();

    const checksum = Hash.sha256(bytes);
    const resA = await fetch.blob(url, {}, { checksum: 'sha256-FAIL' });
    const resB = await fetch.blob(url, {}, { checksum });
    const actual = new Uint8Array(resB.data ? await resB.data.arrayBuffer() : []);

    assertFail(resA);
    assertSuccess(resB);

    expect(actual).to.eql(bytes);
    expect(resA.checksum).to.eql({ valid: false, expected: 'sha256-FAIL', actual: checksum });
    expect(resB.checksum).to.eql({ valid: true, expected: checksum, actual: checksum });

    fetch.dispose();
    await server.dispose();
  });
});

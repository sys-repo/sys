import { Hash } from '@sys/crypto/hash';
import { type t, Testing, describe, expect, it } from '../../-test.ts';

import { print } from './-u.ts';
import { Fetch } from './mod.ts';

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
    expect(error?.message).to.include(`412: Pre-condition failed (checksum-mismatch)`);
    expect(error?.message).to.include(`does not match the expected checksum:`);
    expect(error?.message).to.include(res.checksum?.actual);
    expect(error?.message).to.include(res.checksum?.expected);
  };

  it('text: { checksum }', async () => {
    const text = 'text-🌳';
    const server = Testing.Http.server(() => Testing.Http.text(text));
    const url = server.url.base;
    const fetch = Fetch.create();

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
    const url = server.url.base;
    const fetch = Fetch.create();

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
});

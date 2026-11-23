import { Browser, expect } from '@sys/testing/server';

Deno.test('the sample proxy serves the passkey proof page in Chrome', async () => {
  const [executablePath] = Deno.args;
  const page = await Browser.load('http://localhost:1234/-passkey-proof.html#inspect', {
    executablePath,
    waitAfterLoad: 2_000,
  });
  expect(page.errors).to.eql([]);
});

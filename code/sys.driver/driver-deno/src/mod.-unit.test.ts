import { describe, expect, it } from './-test.ts';
import { env } from './env.ts';

describe('DenoCloud (client)', () => {
  it('.env contains values ← secrets', () => {
    const expectValue = <T>(obj: T, ns: string, key: keyof T) => {
      const value = obj[key];
      expect(value).to.be.string;

      const text = String(value);
      const length = text.length;
      console.info(`> ${String(key)}:`, '*'.repeat(Math.min(length, 10)), `(${length})`);

      expect(text.length).to.be.greaterThan(10, `missing secret value for {${ns}.${String(key)}}`);
    };

    console.info('.env (secrets)');
    expectValue(env.privy, 'privy', 'appId');
    expectValue(env.privy, 'privy', 'appSecret');

    expectValue(env.deno, 'deno', 'accessToken');
    expectValue(env.deno, 'deno', 'orgId');
  });
});

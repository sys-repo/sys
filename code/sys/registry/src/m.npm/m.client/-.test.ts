import { describe, expect, it } from '../-test.ts';
import { Npm } from './mod.ts';

describe('@sys/registry/npm (client)', () => {
  it('API', async () => {
    const root = await import('@sys/registry/npm');
    const client = await import('@sys/registry/npm/client');
    expect(root.Npm).to.equal(Npm);
    expect(client.Npm).to.equal(Npm);
  });
});

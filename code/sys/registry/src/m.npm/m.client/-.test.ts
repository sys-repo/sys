import { describe, expect, it } from '../-test.ts';
import { Npm } from './mod.ts';

describe('@sys/registry/npm (client)', () => {
  it('API', async () => {
    const root = await import('@sys/registry/npm');
    const client = await import('@sys/registry/npm/client');
    expect(root.Npm).to.equal(Npm);
    expect(root.Npm.Fetch).to.equal(Npm.Fetch);
    expect(root.Npm.Import).to.equal(Npm.Import);
    expect('Fetch' in root).to.eql(false);
    expect('Import' in root).to.eql(false);

    expect(client.Npm).to.equal(Npm);
    expect(client.Npm.Fetch).to.equal(Npm.Fetch);
    expect(client.Npm.Import).to.equal(Npm.Import);
    expect('Fetch' in client).to.eql(false);
    expect('Import' in client).to.eql(false);
  });
});

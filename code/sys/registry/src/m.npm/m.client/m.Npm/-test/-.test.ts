import { describe, expect, it } from '../../../-test.ts';
import { Is } from '../../m.Is/mod.ts';
import { Npm } from '../mod.ts';

describe('@sys/registry/npm (client)', () => {
  it('API', async () => {
    const root = await import('@sys/registry/npm');
    const client = await import('@sys/registry/npm/client');
    expect(root.Npm).to.equal(Npm);
    expect(root.Npm.Fetch).to.equal(Npm.Fetch);
    expect(root.Npm.Is).to.equal(Is);
    expect(root.Npm.Import).to.equal(Npm.Import);
    expect('Fetch' in root).to.eql(false);
    expect('Is' in root).to.eql(false);
    expect('Import' in root).to.eql(false);

    expect(client.Npm).to.equal(Npm);
    expect(client.Npm.Fetch).to.equal(Npm.Fetch);
    expect(client.Npm.Is).to.equal(Is);
    expect(client.Npm.Import).to.equal(Npm.Import);
    expect('Fetch' in client).to.eql(false);
    expect('Is' in client).to.eql(false);
    expect('Import' in client).to.eql(false);
  });
});

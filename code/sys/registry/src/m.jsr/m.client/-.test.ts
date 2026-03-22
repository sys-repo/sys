import { describe, expect, it } from '../-test.ts';
import { Jsr } from './mod.ts';

describe('@sys/registry/jsr (client)', () => {
  it('API', async () => {
    const root = await import('@sys/registry/jsr');
    const client = await import('@sys/registry/jsr/client');
    expect(root.Jsr).to.equal(Jsr);
    expect(root.Jsr.Fetch).to.equal(Jsr.Fetch);
    expect(root.Jsr.Import).to.equal(Jsr.Import);
    expect('Fetch' in root).to.eql(false);
    expect('Import' in root).to.eql(false);

    expect(client.Jsr).to.equal(Jsr);
    expect(client.Jsr.Fetch).to.equal(Jsr.Fetch);
    expect(client.Jsr.Import).to.equal(Jsr.Import);
    expect('Fetch' in client).to.eql(false);
    expect('Import' in client).to.eql(false);
  });
});

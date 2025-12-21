import { describe, expect, it } from '../../../../-test.ts';
import { orbiterConfigOf, writeOrbiterConfigFile } from '../u.config.ts';

describe('provider.orbiter: u.config', () => {
  it('orbiterConfigOf: builds orbiter.json config shape', () => {
    const provider = {
      kind: 'orbiter',
      siteId: 'bc6366c5-7c26-4ee1-a6d1-b61a93010dd7',
      domain: 'fs',
    };

    const config = orbiterConfigOf({
      provider: provider as any, // provider type lives in deploy namespace; keep test small.
      buildDir: 'staging-1/ui-react-components',
    });

    expect(config).to.eql({
      siteId: 'bc6366c5-7c26-4ee1-a6d1-b61a93010dd7',
      domain: 'fs',
      buildCommand: 'echo no-op',
      buildDir: 'staging-1/ui-react-components',
    });
  });

  it('writeOrbiterConfigFile: writes expected json to deps.writeText', async () => {
    const calls: Array<{ path: string; text: string }> = [];
    const deps = {
      writeText: async (path: string, text: string) => void calls.push({ path, text }),
    };

    const provider = { kind: 'orbiter', siteId: 'S', domain: 'tmp' };
    const res = await writeOrbiterConfigFile(deps as any, {
      path: '/tmp/orbiter.json',
      provider: provider as any,
      buildDir: 'staging-1/ui-react-components',
    });

    expect(res.ok).to.eql(true);
    expect(calls.length).to.eql(1);
    expect(calls[0]!.path).to.eql('/tmp/orbiter.json');

    // Don’t overfit Json.stringify formatting; just assert payload.
    const parsed = JSON.parse(calls[0]!.text);
    expect(parsed).to.eql({
      siteId: 'S',
      domain: 'tmp',
      buildCommand: 'echo no-op',
      buildDir: 'staging-1/ui-react-components',
    });
  });

  it('writeOrbiterConfigFile: returns ok:false on write failure', async () => {
    const deps = {
      async writeText() {
        throw new Error('nope');
      },
    };

    const provider = { kind: 'orbiter', siteId: 'S', domain: 'tmp' };
    const res = await writeOrbiterConfigFile(deps as any, {
      path: '/tmp/orbiter.json',
      provider: provider as any,
      buildDir: 'staging-1/ui-react-components',
    });

    expect(res.ok).to.eql(false);
  });
});

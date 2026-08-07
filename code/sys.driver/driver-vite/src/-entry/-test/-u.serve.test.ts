import { describe, expect, it, type t } from '../../-test.ts';
import { serveWith } from '../u.serve.ts';

const PREVIEW_LIMITS = {
  manifestBytes: 16 * 1024 * 1024,
  entries: 8_193,
  fileBytes: 128 * 1024 * 1024,
  totalBytes: 1024 * 1024 * 1024,
} as const;

describe('ViteEntry.serve', () => {
  it('delegates defaults to explicit local Dist preview authority', async () => {
    const harness = createHarness();
    await serveWith({ cmd: 'serve' }, harness.deps);

    expect(harness.calls).to.eql([{
      dir: 'dist',
      limits: PREVIEW_LIMITS,
      port: 8080,
      silent: false,
    }]);
  });

  it('forwards explicit CLI path, port, and silent presentation', async () => {
    const harness = createHarness();
    await serveWith({
      cmd: 'serve',
      dir: './build/client',
      port: 49152,
      silent: true,
    }, harness.deps);

    expect(harness.calls).to.eql([{
      dir: './build/client',
      limits: PREVIEW_LIMITS,
      port: 49152,
      silent: true,
    }]);
  });
});

function createHarness() {
  const calls: t.DistServer.Local.Args[] = [];
  return {
    calls,
    deps: {
      Local: {
        serve: (input: t.DistServer.Local.Args) => {
          calls.push(input);
          return Promise.resolve();
        },
      },
    },
  };
}

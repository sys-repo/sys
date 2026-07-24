import { describe, expect, it } from '../../../-test.ts';
import { createPlatform } from '../u.platform.ts';

describe('Cli.Screen platform adapter', () => {
  it('prefers Deno terminal measurement over the Node-style fallback', () => {
    const platform = createPlatform(() => ({
      Deno: { consoleSize: () => ({ columns: 132, rows: 48 }) },
      process: { stdout: { columns: 100, rows: 30 } },
    }));

    expect(platform.measure()).to.eql({ width: 132, height: 48 });
  });

  it('uses Node-style measurement when Deno is absent', () => {
    const platform = createPlatform(() => ({
      process: { stdout: { columns: 100, rows: 30 } },
    }));

    expect(platform.measure()).to.eql({ width: 100, height: 30 });
  });

  it('falls through to Node-style measurement when Deno measurement throws', () => {
    const platform = createPlatform(() => ({
      Deno: {
        consoleSize() {
          throw new Error('not a terminal');
        },
      },
      process: { stdout: { columns: 100, rows: 30 } },
    }));

    expect(platform.measure()).to.eql({ width: 100, height: 30 });
  });

  it('preserves partial Deno measurement without consulting Node dimensions', () => {
    const platform = createPlatform(() => ({
      Deno: { consoleSize: () => ({ columns: 132, rows: 0 }) },
      process: { stdout: { columns: 100, rows: 30 } },
    }));

    expect(platform.measure()).to.eql({ width: 132, height: undefined });
  });

  it('returns an attachment-specific resize cleanup', () => {
    const attached: (() => void)[] = [];
    const removed: (() => void)[] = [];
    const platform = createPlatform(
      () => ({}),
      (handler) => {
        attached.push(handler);
        return () => removed.push(handler);
      },
    );
    const handler = () => {};

    const stop = platform.observeResize(handler);
    stop();

    expect(attached).to.eql([handler]);
    expect(removed).to.eql([handler]);
  });
});

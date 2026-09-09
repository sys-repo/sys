import { describe, expect, it, Num } from '../../../-test.ts';
import { MAX_TERMINAL_CELLS } from '../../u/u.layout.ts';
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

  it('rejects non-finite terminal dimensions', () => {
    const platform = createPlatform(() => ({
      Deno: {
        consoleSize: () => ({ columns: Num.INFINITY, rows: 24 }),
      },
    }));

    expect(platform.measure()).to.eql({ width: undefined, height: 24 });
  });

  it('floors terminal dimensions and rejects values above the layout maximum', () => {
    const exact = createPlatform(() => ({
      Deno: {
        consoleSize: () => ({ columns: MAX_TERMINAL_CELLS + 0.9, rows: 24.9 }),
      },
    }));
    const oversized = createPlatform(() => ({
      Deno: {
        consoleSize: () => ({ columns: MAX_TERMINAL_CELLS + 1, rows: Number.MAX_VALUE }),
      },
    }));

    expect(exact.measure()).to.eql({ width: MAX_TERMINAL_CELLS, height: 24 });
    expect(oversized.measure()).to.eql({ width: undefined, height: undefined });
  });

  it('returns an attachment-specific resize cleanup', () => {
    const attached: (() => void)[] = [];
    const removed: (() => void)[] = [];
    const platform = createPlatform(() => ({
      Deno: {
        build: { os: 'linux' },
        addSignalListener: (_signal, handler) => attached.push(handler),
        removeSignalListener: (_signal, handler) => removed.push(handler),
      },
    }));
    const handler = () => {};

    const observation = platform.observeResize(handler);
    expect(observation.kind).to.eql('attached');
    if (observation.kind === 'attached') observation.stop();

    expect(attached).to.eql([handler]);
    expect(removed).to.eql([handler]);
  });

  it('classifies absent signal capability as unsupported', () => {
    const platform = createPlatform(() => ({
      process: { stdout: { columns: 100, rows: 30 } },
    }));

    expect(platform.observeResize(() => {})).to.eql({ kind: 'unsupported' });
  });

  it('classifies Windows SIGWINCH as unsupported without registration', () => {
    let attached = 0;
    const platform = createPlatform(() => ({
      Deno: {
        build: { os: 'windows' },
        addSignalListener: () => attached += 1,
        removeSignalListener: () => {},
      },
    }));

    expect(platform.observeResize(() => {})).to.eql({ kind: 'unsupported' });
    expect(attached).to.eql(0);
  });

  it('does not swallow registration failures on supported runtimes', () => {
    const error = new Error('registration failed');
    const platform = createPlatform(() => ({
      Deno: {
        build: { os: 'linux' },
        addSignalListener: () => {
          throw error;
        },
        removeSignalListener: () => {},
      },
    }));

    expect(() => platform.observeResize(() => {})).to.throw(error);
  });
});

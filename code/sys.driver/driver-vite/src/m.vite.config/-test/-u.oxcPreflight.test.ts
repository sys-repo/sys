import { describe, expect, it, Path } from '../../-test.ts';
import { oxcPreflightPlugin } from '../u.oxcPreflight.ts';

describe('ViteConfig: oxcPreflightPlugin', () => {
  it('runs Vite transformWithOxc against the resolved config', async () => {
    const calls: unknown[][] = [];
    const config = {
      root: '/tmp/app',
      oxc: {
        include: /\.tsx$/,
        exclude: /node_modules/,
        jsxInject: '/* inject */',
        jsx: { runtime: 'automatic' },
      },
    };
    const plugin = oxcPreflightPlugin({
      load: async () => ({
        transformWithOxc: async (...args) => {
          calls.push(args);
          return { code: 'ok', errors: [], warnings: [] };
        },
      }),
    });

    await configResolved(plugin, config);

    expect(calls.length).to.eql(1);
    expect(calls[0][0]).to.contain('data-sys-oxc-preflight');
    expect(calls[0][1]).to.eql(Path.join('/tmp/app', '-sys.oxc-preflight.tsx'));
    expect(calls[0][3]).to.eql(undefined);
    expect(calls[0][4]).to.equal(config);

    const options = calls[0][2] as Record<string, unknown>;
    expect(options.lang).to.eql('tsx');
    expect(options.sourcemap).to.eql(true);
    expect(options.jsx).to.eql({ runtime: 'automatic' });
    expect('include' in options).to.eql(false);
    expect('exclude' in options).to.eql(false);
    expect('jsxInject' in options).to.eql(false);
  });

  it('skips when OXC is explicitly disabled', async () => {
    const plugin = oxcPreflightPlugin({
      load: async () => {
        throw new Error('load should not be called');
      },
    });

    await configResolved(plugin, { root: '/tmp/app', oxc: false });
  });

  it('fails startup with preflight context', async () => {
    const plugin = oxcPreflightPlugin({
      filename: '/tmp/app/probe.tsx',
      load: async () => ({
        transformWithOxc: async () => {
          throw new Error('Failed to recover `TsconfigCache` type from napi value');
        },
      }),
    });

    let message = '';
    try {
      await configResolved(plugin, { root: '/tmp/app', oxc: { jsx: { runtime: 'automatic' } } });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }

    expect(message).to.contain('OXC preflight failed.');
    expect(message).to.contain('plugin: sys:oxc-preflight');
    expect(message).to.contain('root: /tmp/app');
    expect(message).to.contain('file: /tmp/app/probe.tsx');
    expect(message).to.contain('Failed to recover `TsconfigCache` type from napi value');
  });
});

async function configResolved(plugin: unknown, config: Record<string, unknown>) {
  const hook = (plugin as { configResolved?: unknown }).configResolved;
  if (typeof hook !== 'function') throw new Error('Expected configResolved hook');
  await hook(config);
}

import { build, createServer, type InlineConfig } from 'vite';
import { expect, Fs, Hash, Is, Str, Try } from '../../../-test.ts';
import { VitePlugins } from '../../mod.ts';
import type { BuildFixture } from './t.fixture.ts';

export const SOURCE = '<!doctype html><script type="module" src="../main.js"></script>';

/** Each case owns its written project and awaits cleanup, including after failed setup. */
export async function createFixture(): Promise<BuildFixture> {
  const tmp = await Fs.makeTempDir({ prefix: 'vite.html-integrity.' });
  const root = tmp.absolute;
  const fixture: BuildFixture = {
    root,
    config: {
      root,
      configFile: false,
      base: './',
      logLevel: 'silent',
      plugins: [VitePlugins.HtmlIntegrity.plugin()],
      // Own CSS configuration: Vite's background discovery can outlive dev.close().
      css: { postcss: { plugins: [] } },
      build: { outDir: 'dist', rollupOptions: { input: Fs.join(root, 'nested/index.html') } },
    },
    async [Symbol.asyncDispose]() {
      await Fs.remove(root);
    },
  };

  try {
    await Fs.write(Fs.join(root, 'nested/index.html'), SOURCE, { throw: true });
    await Fs.write(
      Fs.join(root, 'main.js'),
      Str.dedent(`
        import './main.css';
        globalThis.loadLazy = () => import('./lazy.js');
        console.info('entry');
      `),
      { throw: true },
    );
    await Fs.write(Fs.join(root, 'main.css'), 'body { color: rgb(12, 34, 56); }', { throw: true });
    await Fs.write(
      Fs.join(root, 'lazy.js'),
      Str.dedent(`
        import './lazy.css';
        export const lazy = 'lazy';
      `),
      { throw: true },
    );
    await Fs.write(Fs.join(root, 'lazy.css'), 'body { background: white; }', { throw: true });
    return fixture;
  } catch (error) {
    return disposeAndRethrow(fixture, error);
  }
}

/** A missing HTML file is a fixture failure, never an empty successful build. */
export async function readBuiltHtml(root: string): Promise<string> {
  const path = Fs.join(root, 'dist/nested/index.html');
  const { data } = await Fs.readText(path);
  if (!Is.str(data)) throw new Error(`fixture: missing written HTML ${path}`);
  return data;
}

/** Refusal must come from this plugin, not an unrelated Vite or fixture failure. */
export async function expectBuildRefusal(config: InlineConfig, reason: string): Promise<void> {
  const { result } = await Try.run(() => build(config));
  if (result.ok) throw new Error(`expected integrity build refusal: ${reason}`);
  expect(result.error.message).to.include('[sys:html-integrity]');
  expect(result.error.message).to.include(reason);
}

/** Recompute from disk, independently of the plugin's parser and digest cache. */
export async function expectWritten(root: string, base: string, count = 2): Promise<void> {
  const html = await readBuiltHtml(root);
  // Vite's controlled generated fixture uses double-quoted attributes, not arbitrary authored HTML.
  const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/g)];
  expect(tags.length).to.eql(count);
  for (const [tag] of tags) {
    const url = /[\t\n\f\r ](?:src|href)="([^"]+)"/.exec(tag)?.[1];
    if (!url) throw new Error(`fixture: missing resource URL in ${tag}`);
    const relative = base === './' || base === '' ? `nested/${url}` : url.slice(base.length);
    const path = Fs.resolve(root, 'dist', relative);
    const { data: bytes } = await Fs.read(path);
    if (!bytes) throw new Error(`fixture: missing written asset ${path}`);
    const expected = Hash.sha256(bytes, { encoding: 'base64' });
    const integrity = /[\t\n\f\r ]integrity="([^"]*)"/.exec(tag)?.[1];
    expect(integrity, `integrity="${expected}" in ${tag}`).to.eql(expected);
    expect(tag).to.match(/[\t\n\f\r ]crossorigin(?:="(?:anonymous)?")?(?=[\t\n\f\r ]|\/?>)/);
  }
}

/** Exercise the real development transform and await server shutdown under leak checks. */
export async function expectDevelopment(config: InlineConfig): Promise<void> {
  const dev = await createServer(config);
  try {
    const html = await dev.transformIndexHtml('/nested/index.html', SOURCE);
    const integrityPlugin = dev.config.plugins.find((plugin) =>
      plugin.name === 'sys:html-integrity'
    );
    expect(html).not.to.include('integrity=');
    expect(integrityPlugin).to.eql(undefined);
  } finally {
    await dev.close();
  }
}

/**
 * Helpers:
 */

/** Preserve setup failure, including when cleanup also fails. */
async function disposeAndRethrow(
  fixture: BuildFixture,
  error: unknown,
): Promise<never> {
  try {
    await fixture[Symbol.asyncDispose]();
  } catch (cleanupError) {
    throw new AggregateError(
      [error, cleanupError],
      'Integrity fixture setup and cleanup failed.',
    );
  }
  throw error;
}

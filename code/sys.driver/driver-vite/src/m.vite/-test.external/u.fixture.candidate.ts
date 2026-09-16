import { build, createLogger, createServer } from 'vite';
import { expect, Fs, Is, Path, SAMPLE } from '../../-test.ts';
import { ViteConfig } from '../../m.vite.config/mod.ts';

const SAMPLES = {
  baseline: {
    dir: SAMPLE.Dirs.samplePublishedBaseline,
    entry: 'index.html',
    module: 'main.ts',
    react: false,
  },
  'ui-static': {
    dir: SAMPLE.Dirs.samplePublishedUiBaseline,
    entry: 'index.static.html',
    module: 'main.static.tsx',
    react: true,
  },
  'ui-dynamic': {
    dir: SAMPLE.Dirs.samplePublishedUiBaseline,
    entry: 'index.dynamic.html',
    module: 'main.dynamic.ts',
    react: true,
  },
  'ui-components': {
    dir: SAMPLE.Dirs.samplePublishedUiComponents,
    entry: 'index.html',
    module: 'main.tsx',
    react: true,
  },
} as const;

/** Local driver configuration against unchanged published application imports. */
export async function proveCandidate(sample: keyof typeof SAMPLES) {
  const spec = SAMPLES[sample];
  const tmp = await Fs.makeTempDir({ prefix: 'Vite.candidate-consumer.' });
  try {
    const physical = Fs.join(tmp.absolute, 'app');
    await Fs.copy(spec.dir, physical);
    const cwd = sample === 'baseline' ? Fs.join(tmp.absolute, 'app-link') : physical;
    if (cwd !== physical) await Fs.ensureSymlink(physical, cwd);
    const importsPath = Fs.join(cwd, 'imports.json');
    const originalImports = (await Fs.readText(importsPath)).data;
    expect(Is.string(originalImports)).to.eql(true);
    const options = {
      paths: ViteConfig.paths({ cwd, app: { entry: spec.entry } }),
      workspace: Fs.join(cwd, 'deno.json'),
      plugins: { react: spec.react },
    };

    // Only the driver configuration is local. No consumer import-map or source-alias privilege.
    const config = await ViteConfig.app(options);
    expect(config.resolve?.alias).to.eql([]);
    await build({ ...config, configFile: false });
    expect(await Fs.exists(Fs.join(cwd, 'dist', spec.entry))).to.eql(true);

    const outside = Fs.join(tmp.absolute, 'app-sibling', 'outside.ts');
    const marker = 'OUTSIDE_ROOT_SENTINEL';
    if (sample === 'baseline') {
      await Fs.ensureDir(Path.dirname(outside));
      await Fs.write(outside, `export const secret = '${marker}';\n`);
      await Fs.ensureSymlink(outside, Fs.join(cwd, 'escape.ts'));
    }

    const phase = (name: string) => console.info(`[candidate:${sample}] ${name}`);
    phase('configure dev');
    const devConfig = await ViteConfig.app(options);
    const errors: string[] = [];
    const logger = createLogger();
    const logError = logger.error;
    logger.error = (message, options) => {
      errors.push(message);
      logError(message, options);
    };
    const server = await createServer({
      ...devConfig,
      customLogger: logger,
      configFile: false,
      server: { ...devConfig.server, host: '127.0.0.1', port: 0 },
    });
    try {
      phase('listen');
      await server.listen();
      const base = server.resolvedUrls?.local[0];
      if (!base) throw new Error('Expected a listening candidate dev server');
      expect(server.config.server.fs.strict).to.eql(true);
      expect(server.config.server.fs.allow).to.include(Path.resolve(await Fs.realPath(cwd)));
      expect(server.config.server.fs.allow).not.to.include(await Fs.realPath(tmp.absolute));

      phase('request HTML');
      const html = await request(base, spec.entry);
      expect(html.status, html.text.slice(0, 2_000)).to.eql(200);
      expect(html.contentType).to.include('text/html');
      phase('request entry');
      const entry = await request(base, spec.module);
      expect(entry.status, entry.text.slice(0, 2_000)).to.eql(200);
      expect(entry.contentType).to.include('javascript');
      expect(entry.text.length).to.be.greaterThan(0);
      phase('drain module requests');
      await server.environments.client.waitForRequestsIdle();
      expect(errors.join('\n'), 'dev module errors').to.eql('');

      if (sample === 'baseline') {
        for (const path of ['/escape.ts', `/@fs/${await Fs.realPath(outside)}`]) {
          const denied = await request(base, path);
          const diagnostic = `${path}: HTTP ${denied.status} (${denied.contentType})`;
          expect(denied.text, diagnostic).not.to.include(marker);
          expect(denied.status, `${diagnostic}\n${denied.text.slice(0, 2_000)}`).to.eql(403);
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      phase('close dev');
      await server.close();
      phase('dev closed');
    }
    expect((await Fs.readText(importsPath)).data).to.eql(originalImports);
  } finally {
    await Fs.remove(tmp.absolute, { log: false });
  }
}

/** Consume the entire response within the bounded child probe. */
async function request(base: string, path: string) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(10_000) });
  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    text: await response.text(),
  } as const;
}

import { build, createLogger, createServer } from 'vite';
import { expect, Fs, Is, Path, SAMPLE, Time } from '../../-test.ts';
import { ViteConfig } from '../../m.vite.config/mod.ts';
import { CANDIDATE_TIMEOUT, requestCandidate } from './u.fixture.candidate.http.ts';

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
export async function proveCandidate(sample: keyof typeof SAMPLES, mode: 'build' | 'dev') {
  const started = performance.now();
  const phase = (name: string) => {
    const elapsed = (performance.now() - started).toFixed(0);
    console.info(`[candidate:${sample}:${mode}] +${elapsed}ms ${name}`);
  };
  // One shared cold-start budget, not a fresh long timeout for every request/phase.
  const remaining = () =>
    Math.max(0, Math.ceil(CANDIDATE_TIMEOUT.startup - (performance.now() - started)));
  const spec = SAMPLES[sample];
  phase('prepare isolated app');
  const tmp = await Fs.makeTempDir({ prefix: `Vite.candidate-consumer.${mode}.` });
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
    phase('configure');
    const config = await ViteConfig.app(options);
    expect(config.resolve?.alias).to.eql([]);
    if (mode === 'build') {
      phase('build');
      await build({ ...config, configFile: false });
      expect(await Fs.exists(Fs.join(cwd, 'dist', spec.entry))).to.eql(true);
    } else {
      const outside = Fs.join(tmp.absolute, 'app-sibling', 'outside.ts');
      const marker = 'OUTSIDE_ROOT_SENTINEL';
      if (sample === 'baseline') {
        await Fs.ensureDir(Path.dirname(outside));
        await Fs.write(outside, `export const secret = '${marker}';\n`);
        await Fs.ensureSymlink(outside, Fs.join(cwd, 'escape.ts'));
      }

      const errors: string[] = [];
      const logger = createLogger();
      const logError = logger.error;
      logger.error = (message, options) => {
        errors.push(message);
        logError(message, options);
      };
      phase('create dev server');
      const server = await createServer({
        ...config,
        customLogger: logger,
        configFile: false,
        server: { ...config.server, host: '127.0.0.1', port: 0 },
      });
      try {
        phase('listen');
        await server.listen();
        const base = server.resolvedUrls?.local[0];
        if (!base) throw new Error('Expected a listening candidate dev server');
        expect(server.config.server.fs.strict).to.eql(true);
        expect(server.config.server.fs.allow).to.include(Path.resolve(await Fs.realPath(cwd)));
        expect(server.config.server.fs.allow).not.to.include(await Fs.realPath(tmp.absolute));

        phase('cold HTML');
        const html = await requestCandidate(base, spec.entry, remaining());
        expect(html.status, html.text.slice(0, 2_000)).to.eql(200);
        expect(html.contentType).to.include('text/html');
        phase('cold entry (dependency discovery/optimization enabled)');
        const entry = await requestCandidate(base, spec.module, remaining());
        expect(entry.status, entry.text.slice(0, 2_000)).to.eql(200);
        expect(entry.contentType).to.include('javascript');
        expect(entry.text.length).to.be.greaterThan(0);
        phase('drain cold module requests');
        await Time.waitFor(async () => {
          await server.environments.client.waitForRequestsIdle();
          return true;
        }, { timeout: remaining() });
        expect(errors.join('\n'), 'cold dev module errors').to.eql('');

        // A generous cold-start budget must not conceal a broken ready server.
        phase('steady-state entry');
        const ready = await requestCandidate(base, spec.module);
        expect(ready.status, ready.text.slice(0, 2_000)).to.eql(200);
        expect(ready.contentType).to.include('javascript');
        expect(ready.text.length).to.be.greaterThan(0);
        expect(errors.join('\n'), 'ready dev module errors').to.eql('');

        if (sample === 'baseline') {
          phase('filesystem confinement');
          for (const path of ['/escape.ts', `/@fs/${await Fs.realPath(outside)}`]) {
            const denied = await requestCandidate(base, path);
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
    }
    expect((await Fs.readText(importsPath)).data).to.eql(originalImports);
  } finally {
    phase('remove isolated app');
    await Fs.remove(tmp.absolute, { log: false });
  }
  phase('complete');
}

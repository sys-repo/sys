import { describe, it, Str } from '../../-test.ts';
import { runProbe } from './u.fixture.probe.ts';
import { assertRunOk } from './u.fixture.run.ts';

/** Candidate configuration proof, not acceptance of the immutable published driver. */
describe('Vite candidate with external application authority', () => {
  for (const sample of ['baseline', 'ui-static', 'ui-dynamic', 'ui-components'] as const) {
    it(`${sample}: build and dev without application workspace aliases`, async () => {
      const res = await runProbe({
        name: `candidate-consumer.${sample}`,
        source: `${PROBE_SOURCE}\nawait prove('${sample}');\n`,
        denoArgs: ['run', '-P=test', '--node-modules-dir=auto'],
      });
      assertRunOk(res, `Candidate external consumer failed: ${sample}`);
    });
  }
});

const PROBE_SOURCE = Str.dedent(`
  import { build, createServer } from 'vite';
  import { expect, Fs, SAMPLE } from './src/-test.ts';
  import { ViteConfig } from './src/m.vite.config/mod.ts';

  async function prove(sample: string) {
    const source = sample === 'baseline' ? SAMPLE.Dirs.samplePublishedBaseline
      : sample === 'ui-components' ? SAMPLE.Dirs.samplePublishedUiComponents
      : SAMPLE.Dirs.samplePublishedUiBaseline;
    const entry = sample === 'ui-static' ? 'index.static.html'
      : sample === 'ui-dynamic' ? 'index.dynamic.html' : 'index.html';
    const module = sample === 'baseline' ? '/main.ts'
      : sample === 'ui-static' ? '/main.static.tsx'
      : sample === 'ui-dynamic' ? '/main.dynamic.ts' : '/main.tsx';
    const tmp = await Fs.makeTempDir({ prefix: 'Vite.candidate-consumer.' });
    const cwd = Fs.join(tmp.absolute, 'app');
    await Fs.copy(source, cwd);
    const importsPath = Fs.join(cwd, 'imports.json');
    const originalImports = (await Fs.readText(importsPath)).data;
    const options = {
      paths: ViteConfig.paths({ cwd, app: { entry } }),
      workspace: Fs.join(cwd, 'deno.json'),
      plugins: { react: sample !== 'baseline' },
    };
    try {
      // Only the driver configuration is local. Application resolution uses the copied
      // published fixture unchanged: no writeLocalFixtureImports or source aliases.
      const config = await ViteConfig.app(options);
      await build({ ...config, configFile: false });
      expect(await Fs.exists(Fs.join(cwd, 'dist', entry))).to.eql(true);

      const devConfig = await ViteConfig.app(options);
      const server = await createServer({ ...devConfig, configFile: false });
      try {
        console.info('candidate-dev-resolution', {
          root: server.config.root,
          allow: server.config.server.fs.allow,
          entryExists: await Fs.exists(cwd + module),
          resolved: await server.environments.client.pluginContainer.resolveId(module),
        });
        const transformed = await server.transformRequest(module);
        expect(transformed?.code.length).to.be.greaterThan(0);
      } finally {
        await server.close();
      }
      expect((await Fs.readText(importsPath)).data).to.eql(originalImports);
    } finally {
      await Fs.remove(tmp.absolute, { log: false });
    }
  }
`);

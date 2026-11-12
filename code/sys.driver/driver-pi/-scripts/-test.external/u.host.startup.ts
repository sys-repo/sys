import { PiArgs } from '../../src/m.cli/u/u.args.ts';
import { Cli, Err, expect, Fs, Hash, Is, Json, Obj, Path, Str, type t } from '../common.ts';
import { preloadSources } from './u.host.preload.ts';

type Manifest = {
  readonly name: string;
  readonly version: string;
  readonly type: string;
  readonly bin: { readonly pi: string };
};

/** Test-only materialization and evidence checks; never selects or imports a Pi executable. */
export async function prepareStartup(root: string, admittedCache: string) {
  const sources = preloadSources({ lifetime: 'startup' });
  const hashes: Record<string, string> = {};
  for (const [name, source] of Obj.entries(sources)) {
    const path = Fs.join(root, `${name}.mjs`);
    await Fs.write(path, source, { throw: true });
    expect(await text(path)).to.eql(source);
    hashes[path] = Hash.sha256(source);
  }

  // Verification uses the admission lane's known layout, never the hook's matching algorithm.
  // The unchanged generator selects solely by the child's Deno.mainModule and observed importer.
  const relative = 'npm/registry.npmjs.org/@earendil-works/pi-coding-agent/1.4.0';
  const packageDir = Fs.join(PiArgs.toDenoDir(root), relative);
  const manifest = await Fs.readJson<Manifest>(Fs.join(packageDir, 'package.json'));
  expect(manifest.data?.name).to.eql('@earendil-works/pi-coding-agent');
  expect(manifest.data?.version).to.eql('1.4.0');
  expect(manifest.data?.type).to.eql('module');
  expect(manifest.data?.bin.pi).to.eql('dist/bundle/cli.js');
  const launcher = Fs.join(packageDir, manifest.data!.bin.pi);
  const main = Path.toFileUrl(launcher).href;
  // This complete source contract is the safety premise, not an arbitrary implementation snapshot.
  // Additional imports or work before the cache call require a new containment assessment.
  expect((await text(launcher)).trim()).to.eql(Str.dedent(`
    #!/usr/bin/env node
    import { createRequire, enableCompileCache } from "node:module";

    enableCompileCache();
    createRequire(import.meta.url)("./cli-runtime.js");
  `));
  for (const file of ['package.json', 'dist/bundle/cli.js', 'dist/bundle/cli-runtime.js']) {
    const original = Fs.join(admittedCache, relative, file);
    const copied = Fs.join(packageDir, file);
    hashes[original] = Hash.sha256(await text(original));
    hashes[copied] = Hash.sha256(await text(copied));
    expect(hashes[copied], `unchanged admitted ${file}`).to.eql(hashes[original]);
  }
  const lock = Fs.join(root, 'deno.lock');
  hashes[lock] = Hash.sha256(await text(lock));
  await Fs.writeJson(Fs.join(root, 'sources.json'), hashes, { throw: true });

  return {
    preload: Fs.join(root, 'preload.mjs'),
    async verify(output: t.Process.CaptureOutput) {
      const stdout = Cli.stripAnsi(output.text.stdout);
      const facade = Path.toFileUrl(Fs.join(root, 'facade.mjs')).href;
      expect(lines(stdout, 'PRELOAD main ')).to.eql([main]);
      expect(lines(stdout, 'PRELOAD resolve ').map((line) => Json.parse(line))).to.eql([
        { specifier: 'node:module', parent: main },
        { specifier: 'node:module', parent: facade },
        { specifier: './preload.mjs', parent: facade },
      ]);
      expect(lines(stdout, 'PRELOAD registered')).to.have.length(1);
      expect(lines(stdout, 'PRELOAD deregistered')).to.have.length(1);
      const registered = stdout.indexOf('PRELOAD registered');
      const resolve = stdout.indexOf('PRELOAD resolve ');
      const disabled = stdout.indexOf('PRELOAD deregistered');
      expect(resolve).to.be.greaterThan(registered);
      expect(disabled).to.be.greaterThan(stdout.lastIndexOf('PRELOAD resolve '));
      expect(stdout.indexOf('SYS_REPORT_HOST ')).to.be.greaterThan(disabled);
      expect(output.text.stderr).to.eql('');
      for (const [path, hash] of Obj.entries(hashes)) {
        expect(Hash.sha256(await text(path)), `unchanged after settlement: ${path}`).to.eql(hash);
      }
      await Fs.writeJson(Fs.join(root, 'verified.json'), {
        main,
        scope:
          'official npm-bin initialization, observer shutdown request, and observed shutdown/exit with null stdin; shutdown causality is unisolated; not RPC/EOF or production adoption',
      }, { throw: true });
    },
  } as const;
}

/** Native loader controls run inside session_start, outside Pi's extension transpiler. */
export async function prepareLoaderProbe(root: string, startup: boolean) {
  const files = {
    'loader-probe.mjs': Str.dedent(`
      import { createRequire } from 'node:module';
      import process from 'node:process';
      import { fileURLToPath, pathToFileURL } from 'node:url';
      import expectedArgs from './loader-argv.json' with { type: 'json' };
      export async function observe() {
        const require = createRequire(Deno.mainModule);
        const undici = require('undici');
        const { default: esmUndici } = await import(pathToFileURL(require.resolve('undici')).href);
        const positive = await import('./loader-value.mjs');
        ${startup ? "const { createRequire: facadeRequire } = await import('./facade.mjs');" : ''}
        // Native JSON/error/identity values are the child diagnostic wire contract.
        async function rejected(specifier) {
          try {
            await import(specifier);
            return { name: 'ACCEPTED', message: specifier };
          } catch (error) {
            return { name: error.name, message: error.message };
          }
        }
        return {
          main: Deno.mainModule, cwd: process.cwd(),
          argsMatch: JSON.stringify(Deno.args) === JSON.stringify(expectedArgs),
          argvMatch: JSON.stringify(process.argv) === JSON.stringify([
            Deno.execPath(), fileURLToPath(Deno.mainModule), ...expectedArgs,
          ]),
          markers: { title: process.title, pi: process.env.PI_CODING_AGENT, agent: process.env.AI_AGENT },
          binding: createRequire === require('node:module').createRequire,
          ${startup ? 'facadeBinding: facadeRequire === createRequire,' : ''}
          // Compare the same npm module through CJS/ESM, not external constructors to Pi's bundle.
          npmBinding: esmUndici === undici,
          esm: positive.value,
          bare: await rejected('./loader-bare.mjs'),
          attribute: await rejected('./loader-attribute.mjs'),
        };
      }
    `),
    'loader-value.mjs': "export const value = 'owned ESM module';",
    'loader-bare.mjs': "await import('loader-neighbor' + '.mjs');",
    'loader-attribute.mjs':
      "await import('./loader-neighbor.mjs', { with: { unsupported: 'value' } });",
    'loader-neighbor.mjs': "console.info('LOADER NEIGHBOR executed');",
  };
  for (const [name, source] of Obj.entries(files)) {
    const path = Fs.join(root, name);
    await Fs.write(path, source, { throw: true });
    expect(await text(path)).to.eql(source);
  }
  return Path.toFileUrl(Fs.join(root, 'loader-probe.mjs')).href;
}

/** The same controls run on the unmodified recovery host and the real startup candidate. */
export function expectLoaderProbe(
  observed: unknown,
  output: t.Process.CaptureOutput,
  root: string,
  startup: boolean,
) {
  if (!Is.record(observed)) throw Err.std('Missing native loader evidence.');
  expect(observed.cwd).to.eql(root);
  expect(observed.argsMatch, 'full Deno args without printing prompt bodies').to.eql(true);
  expect(observed.argvMatch, 'full native argv including the official main').to.eql(true);
  expect(observed.binding).to.eql(true);
  expect(observed.npmBinding, 'native npm CJS/ESM module identity').to.eql(true);
  expect(observed.esm).to.eql('owned ESM module');
  expect(observed.markers).to.eql({ title: 'pi', pi: 'true', agent: 'pi' });
  if (startup) {
    expect(observed.main).to.eql(lines(output.text.stdout, 'PRELOAD main ')[0]);
    expect(observed.facadeBinding).to.eql(true);
  }
  for (const key of ['bare', 'attribute']) {
    const error = observed[key];
    if (!Is.record(error)) throw Err.std(`Missing loader control: ${key}`);
    expect(error.name).to.eql('TypeError');
    expect(error.message).to.include(
      key === 'bare'
        ? 'Import "loader-neighbor.mjs" not a dependency'
        : '"unsupported" attribute is not supported.',
    );
  }
  expect(output.text.stdout).not.to.include('LOADER NEIGHBOR executed');
}

/** Checked artifact reads fail before any dependent interpretation. */
async function text(path: string): Promise<string> {
  const read = await Fs.readText(path);
  if (!read.ok || !Is.string(read.data)) throw Err.std(`Unreadable proof artifact: ${path}`);
  return read.data;
}

function lines(stdout: string, prefix: string) {
  return stdout.split('\n').filter((line) => line.startsWith(prefix)).map((line) =>
    line.slice(prefix.length)
  );
}

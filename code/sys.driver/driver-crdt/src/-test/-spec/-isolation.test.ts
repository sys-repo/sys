import { Fs } from '@sys/fs';
import { Process } from '@sys/process';
import { describe, Err, expect, Is, it, Json } from '../-test.ts';
import { initialNote } from '../-fixtures/u.note.ts';

// Deliberately local to this executable spec: only the consumed Deno info v1 fields.
// EsmAssert's lexical local-file scan cannot resolve bare imports or separate code/type edges;
// Workspace.Graph normalizes workspace ownership and omits npm package closure.
type Resolution = { readonly specifier?: string; readonly error?: string };
type Dependency = { readonly code?: Resolution; readonly type?: Resolution };
type InfoModule = {
  readonly specifier: string;
  readonly error?: string;
  readonly dependencies?: readonly Dependency[];
  readonly typesDependency?: { readonly dependency: Resolution };
  readonly npmPackage?: string;
};
type Info = {
  readonly version: number;
  readonly roots: readonly string[];
  readonly modules: readonly InfoModule[];
  readonly imports?: readonly { readonly dependencies: readonly Dependency[] }[];
  readonly redirects: Readonly<Record<string, string>>;
  readonly npmPackages: Readonly<Record<string, { readonly dependencies: readonly string[] }>>;
};
type Reachability = { readonly modules: readonly string[]; readonly packages: readonly string[] };
type Probe = {
  readonly engine: string;
  readonly pid: number;
  readonly value: unknown;
  readonly writers: readonly (string | number)[];
  readonly wasmAfterImport?: boolean;
  readonly wasmAfterFirstUse?: boolean;
};

const cwd = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const fixture = (name: string) => `./src/-test/-fixtures/${name}.ts`;

describe('Isolation evidence | resolved reachability is not native initialization', () => {
  it('package identity matcher → ignores versions but rejects absent and similarly named packages', () => {
    // Synthetic resolver IDs, not a native-engine compatibility matrix.
    for (const name of ['fixture-engine', '@fixture/engine']) {
      for (const version of ['1.0.0', '2.0.0']) {
        assertIncludes({ modules: [], packages: [`${name}@${version}`] }, name);
      }
      for (const packages of [[], [`${name}-extra@1.0.0`]]) {
        expect(() => assertIncludes({ modules: [], packages }, name)).to.throw(
          `Missing reachability: ${name}`,
        );
      }
    }
  });

  const specimens = [
    {
      name: 'neutral values',
      entry: fixture('u.note'),
      owned: '',
      forbidden: ['@automerge/', 'yjs@'],
    },
    {
      name: 'Automerge',
      entry: './src/-test/u/u.probe.automerge.ts',
      owned: '@automerge/automerge',
      forbidden: ['yjs@'],
    },
    {
      name: 'Yjs',
      entry: './src/-test/u/u.probe.yjs.ts',
      owned: 'yjs',
      forbidden: ['@automerge/'],
    },
    {
      name: 'Automerge/Repo control',
      entry: './src/-test/u/u.probe.repo.ts',
      owned: '@automerge/automerge-repo',
      forbidden: ['yjs@'],
    },
    {
      name: 'comparison client',
      entry: './src/-test/-compare/u/u.client.ts',
      owned: '',
      forbidden: ['@automerge/', 'yjs@'],
    },
    {
      name: 'Automerge caller replica',
      entry: './src/-test/-compare/u/u.automerge.ts',
      owned: '@automerge/automerge',
      forbidden: ['yjs@', '@automerge/automerge-repo@'],
    },
    {
      name: 'Yjs caller replica',
      entry: './src/-test/-compare/u/u.yjs.ts',
      owned: 'yjs',
      forbidden: ['@automerge/'],
    },
    {
      name: 'Automerge worker owner',
      entry: './src/-test/-compare/u/u.worker.automerge.ts',
      owned: '@automerge/automerge-repo',
      forbidden: ['yjs@'],
    },
    {
      name: 'Yjs worker owner',
      entry: './src/-test/-compare/u/u.worker.yjs.ts',
      owned: 'yjs',
      forbidden: ['@automerge/'],
    },
  ];
  for (const specimen of specimens) {
    it(`${specimen.name} → code and type-resolution closures exclude sibling and legacy engines`, async () => {
      const info = await collectInfo(specimen.entry);
      const runtime = reachable(info, false);
      const resolution = reachable(info, true);
      const forbidden = [...specimen.forbidden, '/driver-automerge/', '@sys/driver-automerge'];
      assertExcludes(runtime, forbidden);
      assertExcludes(resolution, forbidden);
      if (specimen.owned) {
        assertIncludes(runtime, specimen.owned);
        assertIncludes(resolution, specimen.owned);
      }
      console.info(
        `${specimen.name}: code=${runtime.modules.length}, with-types=${resolution.modules.length}, runtime npm=${runtime.packages.length}`,
      );
    });
  }

  it('type-only Yjs import → resolution reaches the engine without a runtime edge', async () => {
    const info = await collectInfo(fixture('u.type-only-yjs'));
    assertExcludes(reachable(info, false), ['yjs@']);
    assertIncludes(reachable(info, true), 'yjs');
  });

  it('indirect engine re-export → the exclusion assertion fails rather than reporting false isolation', async () => {
    const graph = reachable(await collectInfo(fixture('u.leak-yjs')), false);
    expect(() => assertExcludes(graph, ['yjs@'])).to.throw('Forbidden reachability: yjs@');
  });

  it('legacy side-effect import → the exclusion assertion detects the old driver', async () => {
    const graph = reachable(await collectInfo(fixture('u.leak-legacy')), false);
    expect(() => assertExcludes(graph, ['/driver-automerge/'])).to.throw(
      'Forbidden reachability: /driver-automerge/',
    );
  });

  for (const engine of ['automerge', 'yjs']) {
    it(`${engine} in a fresh process → import and first native use succeed without the runner's cache`, async () => {
      const output = await runDeno(['task', `probe:${engine}`]);
      const report = Json.parse<Probe>(output.text.stdout);
      if (!report) throw Err.std('Probe returned no JSON report.');
      expect(report.engine).to.equal(engine);
      expect(report.pid).not.to.equal(Deno.pid);
      expect(report.value).to.eql(initialNote());
      expect(report.writers.length).to.equal(2);
      expect(report.writers[0]).not.to.equal(report.writers[1]);
      if (engine === 'automerge') {
        expect(report.wasmAfterImport).to.equal(true);
        expect(report.wasmAfterFirstUse).to.equal(true);
      }
    });
  }
});

/** Bound native CLI probes without a second process/lifecycle implementation. */
async function runDeno(args: string[]) {
  const output = await Process.capture({
    cmd: 'deno',
    cwd,
    args,
    executionTimeout: 20_000,
    maxStdoutBytes: 8_000_000,
    maxStderrBytes: 64_000,
  });
  expect(output.outcome, output.text.stderr).to.equal('exited');
  expect(output.success, output.text.stderr).to.equal(true);
  expect(output.stdoutTruncated).to.equal(false);
  expect(output.stderrTruncated).to.equal(false);
  return output;
}

/** Ask the native resolver, not a regex over the entry file or an export-map inventory. */
async function collectInfo(entry: string): Promise<Info> {
  const output = await runDeno(['info', '--json', '--frozen', entry]);
  const info = Json.parse<Info>(output.text.stdout);
  if (!info || info.version !== 1 || !Is.array(info.roots) || !Is.array(info.modules)) {
    throw Err.std('Unsupported Deno info graph shape.');
  }
  expect(info.roots.length).to.equal(1);
  return info;
}

/** Follow resolved fixture edges; npm dependencies are a conservative package-level closure. */
function reachable(info: Info, includeTypes: boolean): Reachability {
  const modules = new Map(info.modules.map((module) => [module.specifier, module]));
  const seen = new Set<string>();
  const packages = new Set<string>();
  const pending = [...info.roots];
  const add = (resolution?: Resolution) => {
    if (!resolution) return;
    if (resolution.error || !resolution.specifier) throw Err.std('Unresolved fixture graph edge.');
    pending.push(resolution.specifier);
  };
  if (includeTypes) {
    for (const imported of info.imports ?? []) {
      for (const dependency of imported.dependencies) add(dependency.type);
    }
  }
  while (pending.length > 0) {
    const requested = pending.shift();
    if (!requested) throw Err.std('Empty fixture graph specifier.');
    const id = info.redirects[requested] ?? requested;
    if (seen.has(id)) continue;
    seen.add(id);
    const module = modules.get(id);
    if (!module || module.error) throw Err.std(`Unresolved fixture module: ${id}`);
    if (module.npmPackage) packages.add(module.npmPackage);
    for (const dependency of module.dependencies ?? []) {
      add(dependency.code);
      if (includeTypes) add(dependency.type);
    }
    if (includeTypes) add(module.typesDependency?.dependency);
  }
  // Deno's npmPackages table contains unused workspace packages too. Only walk reached roots.
  for (const id of packages) {
    const pkg = info.npmPackages[id];
    if (!pkg || !Is.array(pkg.dependencies)) throw Err.std(`Unresolved npm package: ${id}`);
    for (const dependency of pkg.dependencies) packages.add(dependency);
  }
  return { modules: [...seen], packages: [...packages] };
}

/** Engine identity belongs here; exact versions belong to deps.yaml and the frozen lockfile. */
function assertIncludes(graph: Reachability, name: string) {
  const found = graph.packages.some((id) => id.startsWith(`${name}@`));
  if (!found) throw Err.std(`Missing reachability: ${name}`);
}

/** Apply the same assertion to valid entries and deliberately poisoned negative controls. */
function assertExcludes(graph: Reachability, forbidden: string[]) {
  for (const fragment of forbidden) {
    const found = [...graph.modules, ...graph.packages].find((value) => value.includes(fragment));
    if (found) throw Err.std(`Forbidden reachability: ${fragment} at ${found}`);
  }
}

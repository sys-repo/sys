import { build, version as viteVersion } from 'vite';
import { describe, expect, Is, it, Path, type t } from '../../-test.ts';
import { workspaceChunksFixture } from './u.fixture.workspace-chunks.ts';

type Chunk = {
  readonly file: string;
  readonly name: string;
  readonly entry: string | null;
  readonly modules: readonly string[];
  readonly imports: readonly string[];
  readonly dynamicImports: readonly string[];
};
type Proof = {
  readonly error?: string;
  readonly kind: string;
  readonly root: number;
  readonly feature: number;
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly lazy: number;
  readonly descriptors: readonly {
    readonly fresh: boolean;
    readonly registry: string | null;
    readonly writable: boolean;
    readonly configurable: boolean;
  }[];
};

describe('Vite workspace chunks → emitted graph and execution', () => {
  it('exact exports, shared dependency/cycle, lazy side effects and client bootstraps', async () => {
    const fixture = await workspaceChunksFixture();
    await using cleanup = fixture.cleanup;
    const appGraph: Chunk[] = [];
    const workerGraph: Chunk[] = [];
    const { config } = fixture;
    const workerPlugins = config.worker?.plugins;
    await build({
      ...config,
      configFile: false,
      logLevel: 'silent',
      css: { postcss: { plugins: [] } },
      // This capstone executes ESM in Deno, not HTML/DOM preload behavior.
      build: { ...config.build, modulePreload: false },
      plugins: [config.plugins, capture(appGraph)],
      worker: {
        ...config.worker,
        plugins: () => [...(workerPlugins?.() ?? []), capture(workerGraph)],
      },
    });

    const module = (name: string) => Path.join(fixture.lib, `${name}.ts`).replaceAll('\\', '/');
    for (const graph of [appGraph, workerGraph]) {
      const root = containing(graph, module('root'));
      const feature = containing(graph, module('feature'));
      const lazy = containing(graph, module('lazy'));
      expect(root.name).to.eql('root');
      expect(feature.name).to.eql('feature');
      expect(root.file).not.to.eql(feature.file);
      expect(root.modules).not.to.include(module('lazy'));
      expect(graph.some((chunk) => chunk.modules.includes(module('absent')))).to.eql(false);
      expect(graph.filter((chunk) => chunk.modules.includes(module('shared'))).length).to.eql(1);
      expect(feature.modules).to.include(module('cycle'));
      for (const entry of graph.filter((chunk) => chunk.entry)) {
        const startup = closure(graph, entry.file);
        expect(startup.has(root.file)).to.eql(true);
        expect(startup.has(feature.file)).to.eql(true);
        expect(startup.has(lazy.file), 'lazy-only export stays outside startup').to.eql(false);
        expect(entry.dynamicImports).to.include(lazy.file);
        expect(startup.has(containing(graph, module('shared')).file)).to.eql(true);
      }
    }
    // App and SW entries share emitted modules; each realm has independent module instances.
    // The module worker has its own emitted graph.
    const main = appGraph.find((chunk) => chunk.entry?.endsWith('/index.html'));
    const sw = appGraph.find((chunk) => chunk.entry?.endsWith('/sw.ts'));
    const worker = workerGraph.find((chunk) => chunk.entry?.endsWith('/worker.ts'));
    if (!main || !sw || !worker) throw new Error('Missing main/service/module-worker entry');
    expect(sw.file).to.eql('sw.js');
    for (const [kind, entry] of [['main', main], ['sw', sw], ['worker', worker]] as const) {
      const path = Path.join(fixture.app, 'dist', entry.file);
      const proof = await execute(fixture.harness, path);
      expect(proof.error, kind).to.eql(undefined);
      expect(proof.kind).to.eql(kind);
      expect(proof.root).to.eql(41);
      expect(proof.feature).to.eql(42);
      expect(proof.before.filter((item) => item === 'shared')).to.eql(['shared']);
      expect(proof.before).not.to.include('lazy');
      expect(proof.before.slice(-2)).to.eql([`${kind}:body`, `${kind}:disposed`]);
      expect(proof.lazy).to.eql(43);
      expect(proof.after).to.eql([...proof.before, 'lazy']);
      expect(proof.descriptors).to.eql([
        { fresh: true, registry: null, writable: false, configurable: false },
        { fresh: true, registry: null, writable: false, configurable: false },
      ]);
    }
    console.info(`workspace-chunks proof: Vite ${viteVersion}; Deno ${Deno.version.deno}`);
  });
});

/** Capture backend membership and edges before the native bundle handle is released. */
function capture(graph: Chunk[]): t.VitePlugin {
  return {
    name: 'fixture:capture-chunks',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        graph.push({
          file: output.fileName,
          name: output.name,
          entry: output.isEntry ? output.facadeModuleId : null,
          modules: Object.keys(output.modules),
          imports: [...output.imports],
          dynamicImports: [...output.dynamicImports],
        });
      }
    },
  };
}

function containing(graph: readonly Chunk[], module: string) {
  const chunk = graph.find((chunk) => chunk.modules.includes(module));
  if (!chunk) throw new Error(`Missing emitted module: ${module}`);
  return chunk;
}

function closure(graph: readonly Chunk[], file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  const chunk = graph.find((chunk) => chunk.file === file);
  if (!chunk) throw new Error(`Missing emitted import: ${file}`);
  seen.add(file);
  for (const imported of chunk.imports) closure(graph, imported, seen);
  return seen;
}

/** Execute written ESM in fresh Deno worker realms, not a simulated bundler evaluator. */
async function execute(harness: string, entry: string): Promise<Proof> {
  const worker = new Worker(Path.toFileUrl(harness).href, { type: 'module' });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await new Promise<Proof>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`Chunk execution timed out: ${entry}`)), 10_000);
      worker.onmessage = ({ data }) => {
        if (!Is.record<Proof>(data)) return reject(new Error('Invalid chunk proof'));
        resolve(data);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        reject(new Error(event.message));
      };
      worker.postMessage(Path.toFileUrl(entry).href);
    });
  } finally {
    clearTimeout(timer);
    worker.terminate();
  }
}

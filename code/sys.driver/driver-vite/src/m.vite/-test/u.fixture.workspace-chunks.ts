import { Fs, Path, Str } from '../../-test.ts';
import { ViteConfig } from '../../m.vite.config/mod.ts';

/** An isolated workspace, including a symlinked member and independent worker graph. */
export async function workspaceChunksFixture() {
  const tmp = await Fs.makeTempDir({ prefix: 'Vite.workspace-chunks.' });
  const cleanup = new AsyncDisposableStack();
  cleanup.defer(async () => {
    await Fs.remove(tmp.absolute);
  });
  try {
    const root = await Fs.realPath(tmp.absolute);
    const app = Path.join(root, 'app');
    const lib = Path.join(root, 'physical/lib');
    const write = (path: string, text: string) => {
      return Fs.write(Path.join(root, path), Str.dedent(text), { throw: true });
    };
    await Fs.writeJson(Path.join(root, 'deno.json'), { workspace: ['./app', './lib'] });
    await Fs.writeJson(Path.join(app, 'deno.json'), { name: '@fixture/app', version: '0.0.0' });
    await Fs.writeJson(Path.join(lib, 'deno.json'), {
      name: '@fixture/lib',
      version: '0.0.0',
      exports: {
        '.': './root.ts',
        './feature': './feature.ts',
        './lazy': './lazy.ts',
        './absent': './absent.ts',
      },
    });
    await Fs.ensureSymlink(lib, Path.join(root, 'lib'));
    const sources = {
      'physical/lib/shared.ts': `
        (globalThis.chunkTrace ??= []).push('shared');
        export const shared = 40;
      `,
      'physical/lib/root.ts': `
        import { shared } from './shared.ts';
        globalThis.chunkTrace.push('root');
        export const root = shared + 1;
      `,
      'physical/lib/feature.ts': `
        import { shared } from './shared.ts';
        import { cycle } from './cycle.ts';
        export const tail = 2;
        export const feature = () => shared + cycle();
        globalThis.chunkTrace.push('feature');
      `,
      'physical/lib/cycle.ts': `
        import { tail } from './feature.ts';
        export const cycle = () => tail;
      `,
      'physical/lib/lazy.ts': `
        import { shared } from './shared.ts';
        globalThis.chunkTrace.push('lazy');
        export const lazy = shared + 3;
      `,
      'physical/lib/absent.ts': "throw new Error('Unimported export was forced into graph');",
      'app/index.html': '<script type="module" src="./main.ts"></script>',
    };
    for (const [path, source] of Object.entries(sources)) await write(path, source);

    const startWorker = Str.dedent(`
      globalThis.startChunkWorker = () => {
        return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      };
    `);
    for (const kind of ['main', 'sw', 'worker']) {
      const source = `
        import { root } from '@fixture/lib';
        import { feature } from '@fixture/lib/feature';
        const trace = globalThis.chunkTrace ??= [];
        {
          using resource = { [Symbol.dispose]: () => trace.push('${kind}:disposed') };
          trace.push('${kind}:body');
        }
        globalThis.chunkProof = {
          kind: '${kind}', root, feature: feature(),
          load: () => import('@fixture/lib/lazy'),
        };
        ${kind === 'main' ? startWorker : ''}
        ${kind === 'worker' ? 'self.onmessage = () => self.postMessage(feature());' : ''}
      `;
      await write(`app/${kind}.ts`, source);
    }
    const config = await ViteConfig.app({
      paths: ViteConfig.paths({ cwd: app, app: { entry: 'index.html', sw: 'sw.ts' } }),
      workspace: Path.join(root, 'deno.json'),
      plugins: { react: false, wasm: false, optimizeImports: false },
      minify: false,
      chunks(e) {
        e.chunk('root', '@fixture/lib');
        e.chunk('feature', '@fixture/lib/feature');
        e.chunk('absent', '@fixture/lib/absent');
      },
    });
    const harness = Path.join(root, 'execute.ts');
    await Fs.write(harness, EXECUTE, { throw: true });
    return { root, app, lib, config, harness, cleanup: cleanup.move() };
  } finally {
    await cleanup.disposeAsync();
  }
}

/** Fresh realms avoid cross-entry module caches and exercise missing protocol symbols. */
const EXECUTE = Str.dedent(`
  export {};
  declare global {
    var chunkTrace: string[];
    var chunkProof: {
      kind: string;
      root: number;
      feature: number;
      load: () => Promise<{ lazy: number }>;
    };
    var startChunkWorker: () => Worker;
  }
  const native = Symbol;
  function CompatibilitySymbol(description?: string) {
    return native(description);
  }
  const excluded = ['dispose', 'asyncDispose', 'length', 'name', 'prototype'];
  const nativeDescriptors = Object.entries(Object.getOwnPropertyDescriptors(native));
  const retained = nativeDescriptors.filter(([key]) => !excluded.includes(key));
  const descriptors = Object.fromEntries(retained);
  Object.defineProperties(CompatibilitySymbol, descriptors);
  CompatibilitySymbol.prototype = native.prototype;
  Object.defineProperty(globalThis, 'Symbol', { value: CompatibilitySymbol });
  globalThis.chunkTrace = [];
  self.onmessage = async ({ data: entry }) => {
    try {
      await import(entry);
      const proof = globalThis.chunkProof;
      const before = [...globalThis.chunkTrace];
      const { lazy } = await proof.load();
      const after = [...globalThis.chunkTrace];
      const descriptors = (['dispose', 'asyncDispose'] as const).map((key) => {
        const value = Object.getOwnPropertyDescriptor(Symbol, key);
        if (!value) throw new Error('Missing disposal symbol: ' + key);
        return {
          fresh: value.value !== native[key],
          registry: native.keyFor(value.value) ?? null,
          writable: value.writable,
          configurable: value.configurable,
        };
      });
      // Execute the actual Vite-rewritten Worker URL, not just an asset-name assertion.
      if (proof.kind === 'main') {
        const worker = globalThis.startChunkWorker();
        try {
          await new Promise<void>((resolve, reject) => {
            worker.onmessage = ({ data }) => {
              if (data === 42) resolve();
              else reject(new Error('worker value'));
            };
            worker.onerror = (event) => {
              event.preventDefault();
              reject(new Error(event.message));
            };
            worker.postMessage('probe');
          });
        } finally {
          worker.terminate();
        }
      }
      const { kind, root, feature } = proof;
      self.postMessage({ kind, root, feature, before, after, lazy, descriptors });
    } catch (error) {
      self.postMessage({ error: String(error) });
    }
  };
`);

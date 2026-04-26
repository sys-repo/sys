import { Fs, Path } from './common.ts';

interface MetadataEntry {
  src?: string;
  file?: string;
  needsInterop?: boolean;
}

interface Metadata {
  optimized?: Record<string, MetadataEntry>;
}

interface AuditEntry {
  src: string;
  srcAbsolute: string;
  file: string;
  needsInterop: boolean;
  authority: 'consumer' | 'external';
}

interface AuditResult {
  ok: boolean;
  depsDir: string;
  metadataPath: string;
  reason: string;
  entries: Record<string, AuditEntry>;
  wrappers: string[];
  consumers: Record<string, string>;
  mixedAuthority: boolean;
  duplicateWrapper: boolean;
  divergentConsumers: boolean;
}

export const DepAudit = {
  async reactSingletons(cwd: string) {
    const depsDir = Path.join(Path.resolve(cwd), 'node_modules', '.vite', 'deps');
    const metadataPath = Path.join(depsDir, '_metadata.json');
    const metadata = await Fs.readJson<Metadata>(metadataPath);
    if (!metadata.ok || !metadata.data) {
      return {
        ok: false,
        depsDir,
        metadataPath,
        reason: 'missing-metadata',
        entries: {},
        wrappers: [],
        consumers: {},
        mixedAuthority: false,
        duplicateWrapper: false,
        divergentConsumers: false,
      } satisfies AuditResult;
    }

    const entries = wrangle.relevantEntries(metadata.data.optimized ?? {}, cwd, depsDir);
    const wrappers = await wrangle.reactWrappers(depsDir);
    const consumers = await wrangle.consumerWrappers(depsDir, entries);
    const authorities = new Set(
      Object.values(entries)
        .map((entry) => entry.authority)
        .filter(Boolean),
    );
    const consumerWrapperNames = [...new Set(Object.values(consumers).filter(Boolean))];

    return {
      ok: true,
      depsDir,
      metadataPath,
      reason: '',
      entries,
      wrappers,
      consumers,
      mixedAuthority: authorities.size > 1,
      duplicateWrapper: wrappers.length > 1,
      divergentConsumers: consumerWrapperNames.length > 1,
    } satisfies AuditResult;
  },
} as const;

const wrangle = {
  relevantEntries(optimized: Record<string, MetadataEntry>, cwd: string, depsDir: string) {
    const targets = [
      'react',
      'react-dom',
      'react-dom/client',
      'react-inspector',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ];
    return Object.fromEntries(
      targets
        .map((key) => {
          const entry = optimized[key];
          if (!entry?.src || !entry.file) return null;
          const src = Path.resolve(depsDir, entry.src);
          return [key, {
            src: entry.src,
            srcAbsolute: src,
            file: entry.file,
            needsInterop: Boolean(entry.needsInterop),
            authority: wrangle.authority(src, cwd),
          }];
        })
        .filter(Boolean)
        .map((item) =>
          item as [string, {
            src: string;
            srcAbsolute: string;
            file: string;
            needsInterop: boolean;
            authority: 'consumer' | 'external';
          }]
        ),
    );
  },

  authority(srcAbsolute: string, cwd: string) {
    const consumerNodeModules = Path.join(Path.resolve(cwd), 'node_modules');
    const relative = Path.relative(consumerNodeModules, srcAbsolute);
    return relative && !relative.startsWith('..') ? 'consumer' : 'external';
  },

  async reactWrappers(depsDir: string) {
    const files = await Deno.readDir(depsDir);
    const wrappers: string[] = [];
    for await (const item of files) {
      if (!item.isFile) continue;
      if (!wrangle.isReactWrapper(item.name)) continue;
      wrappers.push(item.name);
    }
    return wrappers.sort();
  },

  async consumerWrappers(
    depsDir: string,
    entries: Record<string, { file: string }>,
  ) {
    const targets = ['react-dom', 'react-dom/client', 'react-inspector'];
    return Object.fromEntries(
      await Promise.all(targets.map(async (key) => {
        const file = entries[key]?.file;
        if (!file) return [key, ''];
        const path = Path.join(depsDir, file);
        const text = await Fs.readText(path);
        const wrapper = text.ok && text.data ? wrangle.wrapperImport(text.data) : '';
        return [key, wrapper];
      })),
    );
  },

  wrapperImport(text: string) {
    const match = text.match(/from ["']\.\/(react[^"']*\.js)["']/);
    return match?.[1] ?? '';
  },

  isReactWrapper(name: string) {
    if (name === 'react.js') return true;
    if (!/^react-[^/]+\.js$/.test(name)) return false;
    return ![
      'react-dom',
      'react-inspector',
      'react-error',
      'react-icons',
      'react-spinners',
    ].some((prefix) => name.startsWith(`${prefix}`));
  },
} as const;

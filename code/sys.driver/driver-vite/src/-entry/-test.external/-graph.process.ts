/// <reference lib="deno.unstable" />

import { describe, expect, Fs, Is, it, Json, Obj, ROOT } from '../../-test.ts';

const PACKAGE_DIR = ROOT.resolve('code/sys.driver/driver-vite');
const CANONICAL_PACKAGE_DIR = Deno.realPathSync(PACKAGE_DIR);
const WORKSPACE_LOCK = ROOT.resolve('deno.lock');
const PUBLIC_ENTRY = '@sys/driver-vite/entry';
const PUBLIC_URL = new URL('../mod.ts', import.meta.url).href;
const EXECUTABLE_URL = new URL('../-main.ts', import.meta.url).href;
const ENTRY_URL = new URL('../m.Entry.ts', import.meta.url).href;
const COMMAND_URL = new URL('../u.command/mod.ts', import.meta.url).href;
const MAIN_URL = new URL('../m.Entry.main.ts', import.meta.url).href;
const decoder = new TextDecoder();

const COMMAND_MODULES = [
  '/src/-entry/u.command/u.build.ts',
  '/src/-entry/u.command/u.dev.ts',
  '/src/-entry/u.command/u.info.ts',
  '/src/-entry/u.command/u.serve.ts',
] as const;

const COMMANDS = [
  {
    name: 'build',
    loader: new URL('../u.command/u.load/u.build.ts', import.meta.url).href,
    loaderDynamic: '../u.build.ts',
    command: new URL('../u.command/u.build.ts', import.meta.url).href,
    dynamic: ['../../m.fmt/u.Tasks.ts'],
    forbidden: [
      '/src/-entry/u.command/u.dev.ts',
      '/src/-entry/u.command/u.info.ts',
      '/src/-entry/u.command/u.serve.ts',
      '/src/m.vite/u.dev/',
      '/src/m.server.dist/',
    ],
  },
  {
    name: 'dev',
    loader: new URL('../u.command/u.load/u.dev.ts', import.meta.url).href,
    loaderDynamic: '../u.dev.ts',
    command: new URL('../u.command/u.dev.ts', import.meta.url).href,
    dynamic: ['../../m.fmt/u.Tasks.ts'],
    forbidden: [
      '/src/-entry/u.command/u.build.ts',
      '/src/-entry/u.command/u.info.ts',
      '/src/-entry/u.command/u.serve.ts',
      '/src/m.vite/u/u.build.ts',
      '/src/m.server.dist/',
    ],
  },
  {
    name: 'info',
    loader: new URL('../u.command/u.load/u.info.ts', import.meta.url).href,
    loaderDynamic: '../u.info.ts',
    command: new URL('../u.command/u.info.ts', import.meta.url).href,
    dynamic: [] as const,
    forbidden: [
      '/src/-entry/u.command/u.build.ts',
      '/src/-entry/u.command/u.dev.ts',
      '/src/-entry/u.command/u.serve.ts',
      '/src/m.vite/u/u.build.ts',
      '/src/m.vite/u.dev/',
      '/src/m.server.dist/',
    ],
  },
  {
    name: 'serve',
    loader: new URL('../u.command/u.load/u.serve.ts', import.meta.url).href,
    loaderDynamic: '../u.serve.ts',
    command: new URL('../u.command/u.serve.ts', import.meta.url).href,
    dynamic: [] as const,
    forbidden: [
      '/src/-entry/u.command/u.build.ts',
      '/src/-entry/u.command/u.dev.ts',
      '/src/-entry/u.command/u.info.ts',
      '/src/m.vite/',
      '/code/sys.driver/driver-deno/',
      '/code/sys/server/src/m.server.dist/mod.ts',
      '/code/sys/server/src/m.server.dist/m.Dist.ts',
      '/code/sys/server/src/m.server.dist/u.materialize/',
      '/code/sys/fs/src/m.Fs/m/m.Fs.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/mod.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.create.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.file.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.io.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.owner.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.stage.ts',
      '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.tree.ts',
      'rolldown',
    ],
  },
] as const;

const DISPATCH_DYNAMIC = ['./u.command/u.pkgSubpath.ts', '@sys/cli/fmt'] as const;
const SCRIPT_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);

const AUTHORITY_ROOTS = [
  PUBLIC_ENTRY,
  EXECUTABLE_URL,
  ENTRY_URL,
  COMMAND_URL,
  MAIN_URL,
  ...COMMANDS.flatMap((command) => [command.loader, command.command]),
] as const;

const MODULE_AUTHORITY_PLUGIN = {
  name: 'driver-vite-module-authority',
  rules: {
    'literal-dynamic-import': {
      create(context) {
        return {
          ImportExpression(node) {
            if (node.source.type === 'Literal' && Is.str(node.source.value)) return;
            context.report({
              node,
              message: 'Dynamic imports owned by the command boundary must use string literals.',
            });
          },
        };
      },
    },
    'no-runtime-code-construction': {
      create(context) {
        return {
          Identifier(node) {
            if (node.name !== 'eval' && node.name !== 'Function') return;
            context.report({
              node,
              message: 'Command-boundary owners must not construct runtime source code.',
            });
          },
          MemberExpression(node) {
            const property = node.property;
            if (
              !node.computed || property.type !== 'Literal' ||
              (property.value !== 'eval' && property.value !== 'Function')
            ) return;
            context.report({
              node,
              message: 'Command-boundary owners must not access runtime source constructors.',
            });
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;

const MISSING = Symbol('missing');

type InfoGraph = Readonly<Record<string, unknown>>;
type InfoRecord = Readonly<Record<string, unknown>>;

type RuntimeEdge = {
  readonly authored: string;
  readonly target: string;
  readonly dynamic: boolean;
};

type ResolvedModule = {
  readonly edges: readonly RuntimeEdge[];
};

type ResolvedGraph = {
  readonly roots: readonly string[];
  readonly modules: ReadonlyMap<string, ResolvedModule>;
  readonly redirects: ReadonlyMap<string, string>;
};

type Closure = {
  readonly identities: readonly string[];
  readonly modules: readonly string[];
};

const INFO_GRAPHS = new Map<string, Promise<ResolvedGraph>>();

/**
 * Deterministic resolved-literal graph alarm, layered with AST admission here and
 * the permission-constrained cached serve process. This is not a standalone sandbox.
 */
describe('ViteEntry resolved-literal command authority', () => {
  it('admits only literal module loading across package-local runtime closures', async () => {
    const specifiers = await authoritySources();
    expectSome(specifiers, [...COMMAND_MODULES, '/src/-entry/u.command/u.pkgSubpath.ts']);

    const failures: string[] = [];
    for (const specifier of specifiers) {
      const source = await Deno.readTextFile(new URL(specifier));
      const diagnostics = authorityDiagnostics(specifier, source);
      if (diagnostics.length > 0) {
        failures.push(`${specifier}: ${diagnostics.map((item) => item.id).join(', ')}`);
      }
    }
    if (failures.length > 0) {
      throw new Error(`Command authority AST admission failed:\n${failures.join('\n')}`);
    }
  });

  it('rejects hidden dynamic imports and runtime source construction by AST', () => {
    const cases = [
      {
        source: `const target = './hidden.ts'; void import(target);`,
        rule: 'driver-vite-module-authority/literal-dynamic-import',
      },
      {
        source: `eval('import("./hidden.ts")');`,
        rule: 'driver-vite-module-authority/no-runtime-code-construction',
      },
      {
        source: `new Function('return import("./hidden.ts")');`,
        rule: 'driver-vite-module-authority/no-runtime-code-construction',
      },
      {
        source: `globalThis['eval']('import("./hidden.ts")');`,
        rule: 'driver-vite-module-authority/no-runtime-code-construction',
      },
    ] as const;

    for (const [index, test] of cases.entries()) {
      const diagnostics = authorityDiagnostics(`counterfactual-${index}.ts`, test.source);
      expect(diagnostics.map((item) => item.id)).to.eql([test.rule]);
    }
  });

  it('keeps the public and executable entries statically free of command modules', async () => {
    const publicGraph = await infoGraph(PUBLIC_ENTRY);
    const executableGraph = await infoGraph(EXECUTABLE_URL);

    expect(publicGraph.roots).to.eql([PUBLIC_URL]);
    expect(executableGraph.roots).to.eql([EXECUTABLE_URL]);

    for (const graph of [publicGraph, executableGraph]) {
      const closure = staticClosure(graph);
      expectSome(closure.modules, [
        '/src/-entry/u.command/mod.ts',
        '/src/-entry/m.Entry.ts',
        '/src/-entry/m.Entry.main.ts',
        '/src/-entry/u.command/u.load/u.build.ts',
        '/src/-entry/u.command/u.load/u.dev.ts',
        '/src/-entry/u.command/u.load/u.info.ts',
        '/src/-entry/u.command/u.load/u.serve.ts',
      ]);
      expectNone(resolvedIdentities(closure.modules), [
        ...COMMAND_MODULES,
        '/src/m.fmt/',
        '/src/m.vite/',
        '/src/m.server.dist/',
        'rolldown',
      ]);
    }
  });

  it('keeps default dispatch free of direct command-module edges', async () => {
    const graph = await infoGraph(MAIN_URL);
    const dynamic = directDynamic(graph, MAIN_URL);

    expect(dynamic.map((edge) => edge.authored).sort()).to.eql([...DISPATCH_DYNAMIC].sort());
    expectNone(resolvedIdentities(dynamic.map((edge) => edge.target)), COMMAND_MODULES);

    const registry = staticClosure(await infoGraph(COMMAND_URL));
    expectSome(registry.modules, COMMANDS.map((command) => command.loader));
    expectNone(resolvedIdentities(registry.modules), COMMANDS.map((command) => command.command));
  });

  it('binds each production loader to exactly one command module', async () => {
    for (const command of COMMANDS) {
      const graph = await infoGraph(command.loader);
      expect(graph.roots).to.eql([command.loader]);

      const dynamic = directDynamic(graph, command.loader);
      expect(dynamic.map((edge) => edge.authored)).to.eql([command.loaderDynamic]);
      expect(terminal(graph, dynamic[0].target)).to.eql(command.command);

      const closure = runtimeClosure(graph);
      expectSome(closure.modules, [command.command]);
      expectNone(
        resolvedIdentities(closure.modules),
        COMMANDS.filter((item) => item.name !== command.name).map((item) => item.command),
      );
      expectNone(closure.identities, command.forbidden);
    }
  });

  it('keeps each selected command module within its declared authority', async () => {
    for (const command of COMMANDS) {
      const graph = await infoGraph(command.command);
      expect(graph.roots).to.eql([command.command]);

      const dynamic = directDynamic(graph, command.command);
      expect(dynamic.map((edge) => edge.authored).sort()).to.eql([...command.dynamic].sort());

      const closure = runtimeClosure(graph);
      expectSome(closure.modules, [command.command]);
      expectNone(closure.identities, command.forbidden);

      if (command.name === 'serve') {
        expect(closure.identities.includes('@sys/server/dist/server')).to.eql(true);
        expect(closure.identities.includes('@sys/server/dist')).to.eql(false);
      }
    }
  });

  it('fails closed on malformed graph evidence and canonical forbidden aliases', () => {
    const root = 'file:///graph/root.ts';
    const safe = 'file:///graph/safe.ts';
    const graph = (
      dependency: unknown,
      modules: readonly unknown[] = [{ specifier: safe }],
      version: unknown = 1,
    ): InfoGraph => ({
      version,
      roots: [root],
      modules: [{ specifier: root, dependencies: [dependency] }, ...modules],
    });
    const code = { specifier: './safe.ts', code: { specifier: safe } };

    expect(() => resolveGraph(graph(code, [], 2))).to.throw(/version/);
    expect(() => resolveGraph(graph({ ...code, isDynamic: 'false' }))).to.throw(
      /dynamic metadata/,
    );
    expect(() => resolveGraph(graph({ specifier: './safe.ts' }))).to.throw(
      /neither code nor type/,
    );
    expect(() => resolveGraph(graph(code, [{ specifier: safe }, { specifier: safe }]))).to.throw(
      /duplicate module/,
    );

    const missingDynamic = resolveGraph(graph({ ...code, isDynamic: true }, []));
    expect(() => staticClosure(missingDynamic)).to.throw(/missing/);

    const redirectCycle = resolveGraph({
      version: 1,
      roots: [root],
      redirects: { [root]: safe, [safe]: root },
      modules: [],
    });
    expect(() => staticClosure(redirectCycle)).to.throw(/redirect cycle/);

    const typeOnly = resolveGraph(graph({
      specifier: './types.ts',
      type: { specifier: './types.ts' },
    }, []));
    expect(staticClosure(typeOnly).modules).to.eql([root]);

    const forbidden = new URL('../u.command/u.build.ts', import.meta.url).href;
    const encoded = forbidden.replace('/u.build.ts', '/%75.build.ts');
    const alias = resolveGraph({
      version: 1,
      roots: [root],
      redirects: { [safe]: encoded },
      modules: [
        { specifier: root, dependencies: [code] },
        { specifier: encoded },
      ],
    });
    expect(() => expectNone(staticClosure(alias).identities, ['/src/-entry/u.command/u.build.ts']))
      .to.throw(
        /forbidden/,
      );
  });
});

function authorityDiagnostics(filename: string, source: string): readonly Deno.lint.Diagnostic[] {
  return Deno.lint.runPlugin(MODULE_AUTHORITY_PLUGIN, filename, source);
}

async function authoritySources(): Promise<readonly string[]> {
  const sources = new Map<string, string>();
  for (const root of AUTHORITY_ROOTS) {
    const closure = runtimeClosure(await infoGraph(root));
    for (const specifier of closure.modules) {
      const path = packageScriptPath(specifier);
      if (path) sources.set(path, specifier);
    }
  }
  return [...sources.values()].sort();
}

function packageScriptPath(specifier: string): string | undefined {
  const url = resolvedUrl(specifier, 'authority source');
  if (url.protocol !== 'file:') return;

  let path: string;
  try {
    path = Deno.realPathSync(Fs.Path.fromFileUrl(url));
  } catch (cause: unknown) {
    throw new Error(`Command authority cannot canonicalize source: ${specifier}`, { cause });
  }

  const relative = Fs.Path.relative(CANONICAL_PACKAGE_DIR, path).replaceAll('\\', '/');
  if (!relative.startsWith('src/') || !SCRIPT_EXTENSIONS.has(Fs.Path.extname(path))) return;
  return path;
}

function infoGraph(root: string): Promise<ResolvedGraph> {
  const cached = INFO_GRAPHS.get(root);
  if (cached) return cached;

  const pending = loadInfoGraph(root);
  INFO_GRAPHS.set(root, pending);
  return pending;
}

async function loadInfoGraph(root: string): Promise<ResolvedGraph> {
  const denoDir = Deno.env.get('DENO_DIR');
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'info',
      '--json',
      '--quiet',
      '--frozen',
      `--lock=${WORKSPACE_LOCK}`,
      '--deny-import',
      '--node-modules-dir=none',
      '--config=deno.json',
      root,
    ],
    cwd: PACKAGE_DIR,
    clearEnv: true,
    env: denoDir ? { DENO_DIR: denoDir } : {},
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) {
    throw new Error(`Failed to resolve module graph: ${decoder.decode(output.stderr)}`);
  }

  const parsed = Json.parse<unknown>(decoder.decode(output.stdout));
  if (!Is.record(parsed)) throw new Error('Resolved module graph output is not an object.');
  return resolveGraph(parsed);
}

function resolveGraph(input: InfoGraph): ResolvedGraph {
  const version = requiredOwn(input, 'version', 'graph version');
  if (version !== 1) throw new Error('Resolved module graph version must equal 1.');

  const roots = requiredArray(requiredOwn(input, 'roots', 'roots'), 'roots').map((value) => {
    const specifier = requiredString(value, 'root specifier');
    resolvedUrl(specifier, 'root specifier');
    return specifier;
  });
  const redirects = redirectMap(ownData(input, 'redirects'));
  const modules = new Map<string, ResolvedModule>();

  for (const value of requiredArray(requiredOwn(input, 'modules', 'modules'), 'modules')) {
    const module = requiredRecord(value, 'module');
    const specifier = requiredString(
      requiredOwn(module, 'specifier', 'module specifier'),
      'module specifier',
    );
    resolvedUrl(specifier, 'module specifier');
    if (modules.has(specifier)) {
      throw new Error(`Resolved module graph contains a duplicate module: ${specifier}`);
    }
    if (ownData(module, 'error') !== MISSING) {
      throw new Error(`Resolved module graph contains an error in: ${specifier}`);
    }

    const dependencyInput = ownData(module, 'dependencies');
    const dependencies = dependencyInput === MISSING
      ? []
      : requiredArray(dependencyInput, `dependencies for: ${specifier}`);
    const edges = dependencies.flatMap((dependency) => {
      const edge = runtimeEdge(dependency, specifier);
      return edge ? [edge] : [];
    });
    modules.set(specifier, { edges });
  }

  return { roots, modules, redirects };
}

function runtimeEdge(input: unknown, referrer: string): RuntimeEdge | undefined {
  const dependency = requiredRecord(input, `dependency for: ${referrer}`);
  const authored = requiredString(
    requiredOwn(dependency, 'specifier', 'dependency specifier'),
    'dependency specifier',
  );
  const dynamicInput = ownData(dependency, 'isDynamic');
  if (dynamicInput !== MISSING && !Is.bool(dynamicInput)) {
    throw new Error(`Resolved module graph contains invalid dynamic metadata in: ${referrer}`);
  }

  const codeInput = ownData(dependency, 'code');
  if (codeInput === MISSING) {
    const typeInput = ownData(dependency, 'type');
    if (typeInput === MISSING) {
      throw new Error(`Resolved dependency has neither code nor type in: ${referrer}`);
    }
    const type = requiredRecord(typeInput, `type dependency for: ${referrer}`);
    requiredString(requiredOwn(type, 'specifier', 'type specifier'), 'type specifier');
    return;
  }

  const code = requiredRecord(codeInput, `code dependency for: ${referrer}`);
  const target = requiredString(
    requiredOwn(code, 'specifier', 'code specifier'),
    'code specifier',
  );
  resolvedUrl(target, `code dependency for: ${referrer}`);
  return { authored, target, dynamic: dynamicInput === true };
}

function staticClosure(graph: ResolvedGraph): Closure {
  return closure(graph, false);
}

function runtimeClosure(graph: ResolvedGraph): Closure {
  return closure(graph, true);
}

function closure(graph: ResolvedGraph, followDynamic: boolean): Closure {
  const pending = [...graph.roots];
  const identities = new Set<string>();
  const modules = new Set<string>();

  while (pending.length > 0) {
    const requested = pending.pop();
    if (!requested) continue;
    const specifier = terminal(graph, requested, identities);
    if (modules.has(specifier)) continue;

    const module = admitModule(graph, specifier);
    modules.add(specifier);

    for (const edge of module.edges) {
      addAuthoredIdentity(identities, edge.authored, specifier);
      const dependency = terminal(graph, edge.target, identities);
      if (edge.dynamic && !followDynamic) {
        admitModule(graph, dependency);
      } else if (!modules.has(dependency)) {
        pending.push(edge.target);
      }
    }
  }

  return { identities: [...identities], modules: [...modules] };
}

function directDynamic(graph: ResolvedGraph, module: string): readonly RuntimeEdge[] {
  const specifier = terminal(graph, module);
  return admitModule(graph, specifier).edges.filter((edge) => edge.dynamic);
}

function admitModule(graph: ResolvedGraph, specifier: string): ResolvedModule {
  const module = graph.modules.get(specifier);
  if (!module) throw new Error(`Resolved module graph is missing: ${specifier}`);
  return module;
}

function terminal(
  graph: ResolvedGraph,
  input: string,
  identities: Set<string> = new Set(),
): string {
  let current = input;
  const seen = new Set<string>();
  while (graph.redirects.has(current)) {
    if (seen.has(current)) {
      throw new Error(`Resolved module graph contains a redirect cycle: ${input}`);
    }
    seen.add(current);
    addResolvedIdentity(identities, current);
    current = graph.redirects.get(current)!;
  }
  addResolvedIdentity(identities, current);
  return current;
}

function redirectMap(input: unknown): ReadonlyMap<string, string> {
  if (input === MISSING) return new Map();
  const source = requiredRecord(input, 'redirects');
  const redirects = new Map<string, string>();
  for (const key of Obj.keys(source)) {
    resolvedUrl(key, 'redirect source');
    const target = requiredString(requiredOwn(source, key, `redirect: ${key}`), 'redirect');
    resolvedUrl(target, `redirect target for: ${key}`);
    redirects.set(key, target);
  }
  return redirects;
}

function resolvedIdentities(input: readonly string[]): readonly string[] {
  const identities = new Set<string>();
  for (const identity of input) addResolvedIdentity(identities, identity);
  return [...identities];
}

function addResolvedIdentity(identities: Set<string>, identity: string): void {
  identities.add(identity);
  addUrlComparison(identities, resolvedUrl(identity, 'resolved identity'));
}

function addAuthoredIdentity(
  identities: Set<string>,
  identity: string,
  referrer: string,
): void {
  identities.add(identity);

  if (isRelativeIdentity(identity)) {
    let url: URL;
    try {
      url = new URL(identity, resolvedUrl(referrer, 'dependency referrer'));
    } catch (cause: unknown) {
      throw new Error(`Resolved module graph contains an invalid authored identity: ${identity}`, {
        cause,
      });
    }
    addUrlComparison(identities, url);
    return;
  }

  if (URL.canParse(identity)) {
    addUrlComparison(identities, new URL(identity));
    return;
  }
  if (identity.includes(':')) {
    throw new Error(`Resolved module graph contains an invalid authored identity: ${identity}`);
  }
}

function isRelativeIdentity(identity: string): boolean {
  return identity.startsWith('./') || identity.startsWith('../') || identity.startsWith('/') ||
    identity.startsWith('?') || identity.startsWith('#');
}

function resolvedUrl(identity: string, context: string): URL {
  try {
    return new URL(identity);
  } catch (cause: unknown) {
    throw new Error(`Resolved module graph contains an invalid resolved identity in ${context}.`, {
      cause,
    });
  }
}

function addUrlComparison(identities: Set<string>, url: URL): void {
  identities.add(url.href);
  if (url.protocol !== 'file:') return;

  let path: string;
  try {
    path = Fs.Path.normalize(Fs.Path.fromFileUrl(url));
  } catch (cause: unknown) {
    throw new Error(`Resolved module graph contains an invalid file identity: ${url.href}`, {
      cause,
    });
  }
  identities.add(comparisonPath(path));

  try {
    identities.add(comparisonPath(Deno.realPathSync(path)));
  } catch (cause: unknown) {
    if (!(cause instanceof Deno.errors.NotFound)) {
      throw new Error(`Resolved module graph cannot canonicalize file identity: ${url.href}`, {
        cause,
      });
    }
  }
}

function comparisonPath(input: string): string {
  const normalized = Fs.Path.normalize(input);
  return `/${Fs.Path.relativePosix(normalized)}`;
}

function ownData(input: InfoRecord, key: string): unknown | typeof MISSING {
  return Obj.hasOwn(input, key) ? input[key] : MISSING;
}

function requiredOwn(input: InfoRecord, key: string, field: string): unknown {
  const value = ownData(input, key);
  if (value === MISSING) throw new Error(`Resolved module graph is missing ${field}.`);
  return value;
}

function requiredArray(input: unknown, field: string): readonly unknown[] {
  if (!Is.array(input)) throw new Error(`Resolved module graph contains invalid ${field}.`);
  return input;
}

function requiredRecord(input: unknown, field: string): InfoRecord {
  if (!Is.record(input)) throw new Error(`Resolved module graph contains invalid ${field}.`);
  return input;
}

function requiredString(input: unknown, field: string): string {
  if (!Is.str(input) || input.length === 0) {
    throw new Error(`Resolved module graph contains invalid ${field}.`);
  }
  return input;
}

function expectSome(actual: readonly string[], expected: readonly string[]): void {
  for (const fragment of expected) {
    const found = actual.some((value) => value.includes(fragment));
    if (!found) throw new Error(`Command graph is missing "${fragment}".`);
  }
}

function expectNone(actual: readonly string[], forbidden: readonly string[]): void {
  for (const fragment of forbidden) {
    const matches = actual.filter((value) => value.includes(fragment));
    if (matches.length > 0) {
      throw new Error(`Command graph includes forbidden "${fragment}": ${matches.join(', ')}`);
    }
  }
}

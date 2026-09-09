import { Env, Process } from './common.ts';
import { describe, expect, Fs, Is, it, Json, Obj } from '../../-test.ts';

const PACKAGE_DIR = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));
const WORKSPACE_LOCK = Fs.Path.resolve(PACKAGE_DIR, '../../../deno.lock');
const PUBLIC_ENTRY = '@sys/server/dist/server';
const ENTRY_URL = new URL('../../-exports/-dist.server.ts', import.meta.url);
const HTTP_CLIENT_URL = new URL('../../../http/src/http.client/mod.ts', ENTRY_URL);
const GRAPH_CAPTURE = Object.freeze({
  executionTimeout: 60_000,
  maxStdoutBytes: 16 * 1024 * 1024,
  maxStderrBytes: 256 * 1024,
  terminationGrace: 1_000,
});

type InfoGraph = Readonly<Record<string, unknown>>;
type InfoRecord = Readonly<Record<string, unknown>>;

const FORBIDDEN = [
  '/src/m.server.dist/m.Dist.ts',
  '/src/m.server.dist/u.materialize/',
  '/code/sys/http/src/http.client/',
  '/code/sys/http/src/http.server/m.HttpPull/',
  '/code/sys/fs/src/m.Fs/m/m.Fs.ts',
  '/code/sys/fs/src/m.Fs/u/u.write.ts',
  '/code/sys/fs/src/m.Fs.capability/mod.ts',
  '/code/sys/fs/src/m.Fs.capability/m.Rooted/mod.ts',
  '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.create.ts',
  '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.file.ts',
  '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.owner.ts',
  '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.stage.ts',
  '/code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.tree.ts',
  '/code/sys/fs/src/m.Pkg.Dist/m.Dist.ts',
  '/code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts',
  '/code/sys/fs/src/m.Pkg.Dist/u/u.load.ts',
] as const;
const FORBIDDEN_AUTHORED = [
  '@sys/fs',
  '@sys/fs/capability',
  '@sys/fs/pkg',
  '@sys/http',
  '@sys/http/client',
  '@sys/http/server',
  '@sys/http/server/lifecycle',
  '@sys/server/dist',
] as const;
const MISSING = Symbol('missing');

describe('@sys/server/dist/server resolved module graph', () => {
  it('keeps hosting statically free of acquisition, materialization, and publication graphs', async () => {
    const graph = await infoGraph(PUBLIC_ENTRY);
    const closure = await staticClosure(graph);

    expect(graph.roots).to.eql([ENTRY_URL.href]);
    expectSome(closure.modules, [
      '/src/m.server.dist/m.DistServer.ts',
      '/src/m.server.dist/u.server.start/',
      '/code/sys/fs/src/-exports/-pkg.dist.verify.ts',
      '/code/sys/fs/src/m.Pkg.Dist/m.Local.ts',
      '/code/sys/fs/src/m.Pkg.Dist/m.Pinned.ts',
      '/code/sys/fs/src/m.Pkg.Dist/u.verify/u.pinned.ts',
      '/code/sys/fs/src/m.Pkg.Dist/u.verify/u.pinned.part.ts',
      '/code/sys/http/src/-exports/-http.server.host.ts',
      '/code/sys/http/src/http.server/m.FileBytes/mod.ts',
      '/code/sys/http/src/http.server/m.HttpServer/m.Server.host.ts',
      '/code/sys/http/src/http.server/m.HttpServer/u/u.start.ts',
    ]);
    expectNone(closure.identities, FORBIDDEN);
  });

  it('rejects forbidden redirect source → terminal identities and equivalent file spellings', async () => {
    const root = 'file:///graph/root.ts';
    const safe = 'file:///graph/safe.ts';
    const forbidden = 'file:///graph/code/sys/http/src/http.client/mod.ts';
    const encoded = 'file:///graph/code/sys/http/src/%68ttp.client/mod.ts';
    const encodedSeparator = HTTP_CLIENT_URL.href.replace('/http.client/', '/%2Fhttp.client/');
    const equivalent = [forbidden, encoded, encodedSeparator];
    const alternateCase = HTTP_CLIENT_URL.href.replace('/http.client/', '/HTTP.CLIENT/');
    if (await sameExistingFile(HTTP_CLIENT_URL.href, alternateCase)) equivalent.push(alternateCase);

    const graph = (source: string, terminal: string): InfoGraph => ({
      version: 1,
      roots: [root],
      redirects: { [source]: terminal },
      modules: [
        {
          specifier: root,
          dependencies: [{ specifier: source, code: { specifier: source } }],
        },
        { specifier: terminal },
      ],
    });

    for (const identity of equivalent) {
      for (const [source, terminal] of [[safe, identity], [identity, safe]] as const) {
        await expectStaticClosureFailure(
          graph(source, terminal),
          /Static graph includes forbidden modules/,
        );
      }
    }
  });

  it('classifies authored package, relative, bare, and encoded dynamic identities', async () => {
    const root = 'file:///graph/code/sys/server/src/root.ts';
    const safe = 'file:///graph/safe.ts';
    const encoded = HTTP_CLIENT_URL.href.replace('/http.client/', '/%2fhttp.client/');
    const graph = (
      dependency: unknown,
      modules: readonly unknown[] = [],
      graphRoot = root,
    ): InfoGraph => ({
      version: 1,
      roots: [graphRoot],
      modules: [
        { specifier: graphRoot, dependencies: [dependency] },
        { specifier: safe },
        ...modules,
      ],
    });

    for (const requested of ['@sys/http/client', '../../http/src/http.client/mod.ts']) {
      const input = graph({ specifier: requested, code: { specifier: safe } });
      await expectStaticClosureFailure(input, /Static graph includes forbidden modules/);
    }

    for (
      const requested of [
        '@sys/fs',
        '@sys/fs/capability',
        '@sys/fs/pkg',
        '@sys/http/server',
        '@sys/http/server/lifecycle',
        '@sys/server/dist',
      ]
    ) {
      const forbiddenPackage = graph({ specifier: requested, code: { specifier: safe } });
      await expectStaticClosureFailure(forbiddenPackage, new RegExp(`"${requested}"`));
    }

    for (
      const requested of [
        '@sys/fs/pkg/dist/verify',
        '@sys/http/server/host',
        '@sys/http/server/file-bytes',
        '@sys/server/dist/server',
      ]
    ) {
      const input = graph({ specifier: requested, code: { specifier: safe } });
      expectNone((await staticClosure(input)).identities, FORBIDDEN);
    }

    const bareRoot = 'file:///graph/code/sys/http/src/root.ts';
    const bare = graph(
      { specifier: 'http.client/mod.ts', code: { specifier: safe } },
      [],
      bareRoot,
    );
    expectNone((await staticClosure(bare)).identities, FORBIDDEN);

    const dynamic = graph(
      { specifier: encoded, code: { specifier: encoded }, isDynamic: true },
      [{ specifier: encoded }],
    );
    await expectStaticClosureFailure(dynamic, /Static graph includes forbidden modules/);
  });

  it('fails closed on malformed graph and reachable edge metadata', async () => {
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

    await expectStaticClosureFailure(
      graph({ specifier: './safe.ts', code: { specifier: safe } }, [], 2),
      /version/,
    );
    await expectStaticClosureFailure(graph({ code: { specifier: safe } }), /dependency specifier/);
    await expectStaticClosureFailure(graph({ specifier: './safe.ts', code: {} }), /code specifier/);
    await expectStaticClosureFailure(
      graph({
        specifier: './safe.ts',
        code: { specifier: 'file://bad host/graph/code/sys/http/src/%68ttp.client/mod.ts' },
      }),
      /invalid resolved identity/,
    );
    await expectStaticClosureFailure(graph({ specifier: './safe.ts' }), /code or type/);
    await expectStaticClosureFailure(
      graph({ specifier: './safe.ts', type: {} }),
      /type specifier/,
    );

    for (const isDynamic of ['false', 0, null]) {
      await expectStaticClosureFailure(
        graph({ specifier: './safe.ts', isDynamic, code: { specifier: safe } }),
        /isDynamic/,
      );
    }
  });

  it('admits valid type-only and bounded dynamic edges without traversing dynamic descendants', async () => {
    const root = 'file:///graph/root.ts';
    const dynamic = 'file:///graph/dynamic.ts';
    const forbidden = 'file:///graph/code/sys/http/src/http.client/mod.ts';
    const typeOnly: InfoGraph = {
      version: 1,
      roots: [root],
      modules: [
        {
          specifier: root,
          dependencies: [{ specifier: './types.ts', type: { specifier: './types.ts' } }],
        },
      ],
    };
    expect((await staticClosure(typeOnly)).modules).to.eql([root]);

    const dynamicGraph: InfoGraph = {
      version: 1,
      roots: [root],
      modules: [
        {
          specifier: root,
          dependencies: [{
            specifier: './dynamic.ts',
            code: { specifier: dynamic },
            isDynamic: true,
          }],
        },
        {
          specifier: dynamic,
          dependencies: [{ specifier: forbidden, code: { specifier: forbidden } }],
        },
        { specifier: forbidden },
      ],
    };
    const closure = await staticClosure(dynamicGraph);
    expect(closure.modules).to.eql([root]);
    expectNone(closure.identities, FORBIDDEN);
  });

  it('rejects missing and errored dynamic terminals', async () => {
    const root = 'file:///graph/root.ts';
    const dynamic = 'file:///graph/dynamic.ts';
    const graph = (modules: readonly unknown[]): InfoGraph => ({
      version: 1,
      roots: [root],
      modules: [
        {
          specifier: root,
          dependencies: [{
            specifier: './dynamic.ts',
            code: { specifier: dynamic },
            isDynamic: true,
          }],
        },
        ...modules,
      ],
    });

    await expectStaticClosureFailure(graph([]), /missing a module/);
    await expectStaticClosureFailure(
      graph([{ specifier: dynamic, error: 'failed' }]),
      /contains an error/,
    );
  });
});

async function infoGraph(root: string): Promise<InfoGraph> {
  const env = await Env.load({ cwd: PACKAGE_DIR });
  const denoDir = env.get('DENO_DIR');
  const output = await Process.capture({
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
    env: { FORCE_COLOR: '0', ...(denoDir ? { DENO_DIR: denoDir } : {}) },
    ...GRAPH_CAPTURE,
  });
  if (output.outcome !== 'exited' || !output.success) {
    const detail = output.text.stderr.trim() || '(no stderr)';
    throw new Error(`Failed to resolve module graph (${output.outcome}): ${detail}`);
  }
  if (output.stdoutTruncated) throw new Error('Resolved module graph exceeded its capture bound.');

  const parsed = Json.parse<unknown>(output.text.stdout);
  if (!Is.record(parsed)) throw new Error('Resolved module graph output is not an object.');
  return parsed;
}

type StaticClosure = {
  readonly identities: readonly string[];
  readonly modules: readonly string[];
};

type RuntimeEdge = {
  readonly requested: string;
  readonly target: string;
  readonly isDynamic: boolean;
};

async function staticClosure(input: InfoGraph): Promise<StaticClosure> {
  const version = requiredOwn(input, 'version', 'graph version');
  if (version !== 1) throw new Error('Resolved module graph version must equal 1.');

  const roots = requiredArray(requiredOwn(input, 'roots', 'roots'), 'roots').map((root) => {
    const specifier = requiredString(root, 'root specifier');
    resolvedUrl(specifier, 'root specifier');
    return specifier;
  });
  const redirectInput = ownData(input, 'redirects');
  const redirects = redirectInput === MISSING
    ? new Map<string, string>()
    : redirectMap(redirectInput);
  const modules = new Map<string, InfoRecord>();
  const moduleInput = requiredOwn(input, 'modules', 'modules');
  for (const value of requiredArray(moduleInput, 'modules')) {
    const module = requiredRecord(value, 'module');
    const specifier = requiredString(
      requiredOwn(module, 'specifier', 'module specifier'),
      'module specifier',
    );
    resolvedUrl(specifier, 'module specifier');
    if (modules.has(specifier)) {
      throw new Error(`Resolved module graph contains a duplicate module: ${specifier}`);
    }
    modules.set(specifier, module);
  }

  const pending = [...roots];
  const identities = new Set<string>();
  const traversed = new Set<string>();

  while (pending.length > 0) {
    const source = pending.pop();
    if (!source) continue;
    const terminal = await resolveRedirect(source, redirects, identities);
    if (traversed.has(terminal)) continue;
    const module = admitModule(modules, terminal);
    traversed.add(terminal);

    const dependencyInput = ownData(module, 'dependencies');
    const dependencies = dependencyInput === MISSING
      ? []
      : requiredArray(dependencyInput, `dependencies for: ${terminal}`);
    for (const value of dependencies) {
      const edge = runtimeEdge(value, terminal);
      if (!edge) continue;

      await addAuthoredIdentity(identities, edge.requested, terminal);
      const dependencyTerminal = await resolveRedirect(edge.target, redirects, identities);
      if (edge.isDynamic) {
        admitModule(modules, dependencyTerminal);
      } else if (!traversed.has(dependencyTerminal)) {
        pending.push(edge.target);
      }
    }
  }

  return { identities: [...identities], modules: [...traversed] };
}

function runtimeEdge(input: unknown, referrer: string): RuntimeEdge | undefined {
  const dependency = requiredRecord(input, `dependency for: ${referrer}`);
  const requested = requiredString(
    requiredOwn(dependency, 'specifier', 'dependency specifier'),
    'dependency specifier',
  );

  const dynamicInput = ownData(dependency, 'isDynamic');
  if (dynamicInput !== MISSING && !Is.bool(dynamicInput)) {
    throw new Error(`Resolved module graph contains an invalid isDynamic flag in: ${referrer}`);
  }
  const isDynamic = dynamicInput === true;

  const codeInput = ownData(dependency, 'code');
  const typeInput = ownData(dependency, 'type');
  if (codeInput === MISSING) {
    if (typeInput === MISSING) {
      throw new Error(`Resolved module graph dependency has neither code or type in: ${referrer}`);
    }
    const type = requiredRecord(typeInput, `type edge for: ${referrer}`);
    requiredString(requiredOwn(type, 'specifier', 'type specifier'), 'type specifier');
    return undefined;
  }

  const code = requiredRecord(codeInput, `code edge for: ${referrer}`);
  const target = requiredString(
    requiredOwn(code, 'specifier', 'code specifier'),
    'code specifier',
  );
  return { requested, target, isDynamic };
}

function admitModule(modules: ReadonlyMap<string, InfoRecord>, specifier: string): InfoRecord {
  const module = modules.get(specifier);
  if (!module) throw new Error(`Resolved module graph is missing a module: ${specifier}`);
  if (ownData(module, 'error') !== MISSING) {
    throw new Error(`Resolved module graph contains an error in: ${specifier}`);
  }
  return module;
}

function redirectMap(input: unknown): ReadonlyMap<string, string> {
  const source = requiredRecord(input, 'redirects');
  const redirects = new Map<string, string>();
  for (const key of Obj.keys(source)) {
    const from = requiredString(key, 'redirect source');
    resolvedUrl(from, 'redirect source');
    const value = requiredOwn(source, from, `redirect target for: ${from}`);
    const target = requiredString(value, `redirect target for: ${from}`);
    resolvedUrl(target, `redirect target for: ${from}`);
    redirects.set(from, target);
  }
  return redirects;
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

function requiredOwn(input: InfoRecord, field: string, context: string): unknown {
  const value = ownData(input, field);
  if (value === MISSING) {
    throw new Error(`Resolved module graph is missing ${field} in: ${context}`);
  }
  return value;
}

function ownData(input: InfoRecord, field: string): unknown | typeof MISSING {
  return Obj.hasOwn(input, field) ? input[field] : MISSING;
}

async function resolveRedirect(
  source: string,
  redirects: ReadonlyMap<string, string>,
  identities: Set<string>,
): Promise<string> {
  const seen = new Set<string>();
  let current = source;

  while (true) {
    if (seen.has(current)) {
      throw new Error(`Resolved module graph contains a redirect cycle: ${current}`);
    }
    seen.add(current);
    await addResolvedIdentity(identities, current);

    const next = redirects.get(current);
    if (next === undefined) return current;
    current = next;
  }
}

async function addResolvedIdentity(identities: Set<string>, identity: string): Promise<void> {
  identities.add(identity);
  await addUrlComparison(identities, resolvedUrl(identity, 'resolved identity'));
}

async function addAuthoredIdentity(
  identities: Set<string>,
  identity: string,
  referrer: string,
): Promise<void> {
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
    await addUrlComparison(identities, url);
    return;
  }

  if (URL.canParse(identity)) {
    await addUrlComparison(identities, new URL(identity));
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

async function addUrlComparison(identities: Set<string>, url: URL): Promise<void> {
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
    identities.add(comparisonPath(await Fs.realPath(path)));
  } catch (cause: unknown) {
    // `Fs.realPath` preserves the host absence class; synthetic graph paths may be absent, while
    // every other canonicalization failure must fail the proof.
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

async function sameExistingFile(left: string, right: string): Promise<boolean> {
  try {
    const leftPath = comparisonPath(
      await Fs.realPath(Fs.Path.fromFileUrl(resolvedUrl(left, 'file fixture'))),
    );
    const rightPath = comparisonPath(
      await Fs.realPath(Fs.Path.fromFileUrl(resolvedUrl(right, 'file fixture'))),
    );
    return leftPath === rightPath;
  } catch (cause: unknown) {
    // Case-equivalence probing is optional only when one spelling is absent.
    if (cause instanceof Deno.errors.NotFound) return false;
    throw cause;
  }
}

async function expectStaticClosureFailure(input: InfoGraph, expected: RegExp): Promise<void> {
  try {
    const closure = await staticClosure(input);
    expectNone(closure.identities, FORBIDDEN);
  } catch (cause) {
    if (!Is.error(cause)) throw new Error('Static graph failed with a non-Error cause.');
    expect(cause.message).to.match(expected);
    return;
  }
  throw new Error(`Expected static graph failure matching ${expected}.`);
}

function expectSome(actual: readonly string[], expected: readonly string[]): void {
  for (const fragment of expected) {
    expect(actual.some((value) => value.includes(fragment))).to.eql(true);
  }
}

function expectNone(actual: readonly string[], forbidden: readonly string[]): void {
  const pathFailures = forbidden.flatMap((fragment) => {
    const matches = actual.filter((value) => value.includes(fragment));
    return matches.length === 0 ? [] : [`"${fragment}": ${matches.join(', ')}`];
  });
  const authoredFailures = FORBIDDEN_AUTHORED.flatMap((specifier) => {
    const matches = actual.filter((value) => {
      if (value === specifier) return true;
      return specifier === '@sys/http/client' && value.startsWith(`${specifier}/`);
    });
    return matches.length === 0 ? [] : [`"${specifier}": ${matches.join(', ')}`];
  });
  const failures = [...pathFailures, ...authoredFailures];
  if (failures.length > 0) {
    throw new Error(`Static graph includes forbidden modules:\n${failures.join('\n')}`);
  }
}

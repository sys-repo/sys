import { Env, Process } from './common.ts';
import { describe, expect, Fs, Is, it, Json, Obj } from '../../-test.ts';

const PACKAGE_DIR = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));
const WORKSPACE_LOCK = Fs.Path.resolve(PACKAGE_DIR, '../../../deno.lock');
const ENTRY = new URL('../m.Dist.ts', import.meta.url);
const HOSTING_FILE = new URL('../u.server/u.error.ts', import.meta.url);
const REQUIRED = [
  '/src/m.server.dist/m.Dist.ts',
  '/src/m.server.dist/u.generation/u.open.ts',
  '/src/m.server.dist/u.generation/u.owner.ts',
  '/src/m.server.dist/u.generation/u.retention.ts',
  '/src/m.server.dist/u.generation/u.result.ts',
  '/src/m.server.dist/u.generation/u.is.ts',
  '/src/m.server.dist/u.materialize/u.run.ts',
  '/src/m.Fs.capability/m.Rooted/u/u.create.ts',
] as const;
const FORBIDDEN = [
  '/src/m.server.dist/m.DistServer.ts',
  '/src/m.server.dist/u.server.',
  '/src/m.server.dist/u.server/',
] as const;
const GRAPH_CAPTURE = Object.freeze({
  executionTimeout: 60_000,
  maxStdoutBytes: 16 * 1024 * 1024,
  maxStderrBytes: 256 * 1024,
  terminationGrace: 1_000,
});

type InfoGraph = Readonly<{
  roots?: unknown;
  modules?: unknown;
}>;

describe('Dist.Generation resolved module graph', () => {
  it('roots the authored generation closure without importing Dist hosting', async () => {
    const graph = await infoGraph();
    expect(graph.roots).to.eql([ENTRY.href]);
    if (!Is.array(graph.modules)) throw new Error('Generation graph modules are missing.');

    const modules: string[] = [];
    for (const input of graph.modules) {
      if (!Is.record(input) || !Is.str(input.specifier)) {
        throw new Error('Generation graph contains a malformed module identity.');
      }
      const specifier = input.specifier;
      if (Obj.hasOwn(input, 'error')) {
        throw new Error(`Generation graph module failed: ${specifier}`);
      }
      modules.push(await canonicalIdentity(specifier));
    }

    for (const required of REQUIRED) {
      expect(
        modules.some((identity) => identity.includes(required)),
        `Generation graph is missing ${required}`,
      ).to.eql(true);
    }
    for (const forbidden of FORBIDDEN) {
      expect(
        modules.some((identity) => identity.includes(forbidden)),
        `Generation graph imported hosting identity ${forbidden}`,
      ).to.eql(false);
    }
  });

  it('canonicalizes equivalent file casing before forbidden matching', async () => {
    const alternateCase = HOSTING_FILE.href.replace(
      '/u.server/u.error.ts',
      '/U.SERVER/U.ERROR.TS',
    );
    if (!await sameExistingFile(HOSTING_FILE.href, alternateCase)) return;

    const identity = await canonicalIdentity(alternateCase);
    expect(identity.includes('/src/m.server.dist/u.server/')).to.eql(true);
  });
});

async function infoGraph(): Promise<InfoGraph> {
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
      ENTRY.href,
    ],
    cwd: PACKAGE_DIR,
    clearEnv: true,
    env: { FORCE_COLOR: '0', ...(denoDir ? { DENO_DIR: denoDir } : {}) },
    ...GRAPH_CAPTURE,
  });
  if (output.outcome !== 'exited' || !output.success) {
    const detail = output.text.stderr.trim() || '(no stderr)';
    throw new Error(`Failed to resolve Generation module graph (${output.outcome}): ${detail}`);
  }
  if (output.stdoutTruncated) {
    throw new Error('Generation module graph exceeded its capture bound.');
  }

  const parsed = Json.parse<unknown>(output.text.stdout);
  if (!Is.record(parsed)) throw new Error('Generation module graph output is not an object.');
  return parsed;
}

async function canonicalIdentity(input: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(input);
  } catch (cause: unknown) {
    throw new Error(`Generation graph contains an invalid identity: ${input}`, { cause });
  }

  if (url.protocol !== 'file:') {
    try {
      return decodeURIComponent(url.href).replaceAll('\\', '/');
    } catch (cause: unknown) {
      throw new Error(`Generation graph contains an invalid identity: ${input}`, { cause });
    }
  }

  let path: string;
  try {
    path = Fs.Path.normalize(Fs.Path.fromFileUrl(url));
  } catch (cause: unknown) {
    throw new Error(`Generation graph contains an invalid file identity: ${input}`, { cause });
  }

  try {
    return comparisonPath(await Fs.realPath(path));
  } catch (cause: unknown) {
    throw new Error(`Generation graph cannot canonicalize file identity: ${input}`, { cause });
  }
}

function comparisonPath(input: string): string {
  return `/${Fs.Path.relativePosix(Fs.Path.normalize(input))}`;
}

async function sameExistingFile(left: string, right: string): Promise<boolean> {
  try {
    const leftPath = comparisonPath(await Fs.realPath(Fs.Path.fromFileUrl(new URL(left))));
    const rightPath = comparisonPath(await Fs.realPath(Fs.Path.fromFileUrl(new URL(right))));
    return leftPath === rightPath;
  } catch (cause: unknown) {
    if (cause instanceof Deno.errors.NotFound) return false;
    throw cause;
  }
}

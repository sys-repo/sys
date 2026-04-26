import { Fs, Path, Process, type t } from './common.ts';
import { fail, ok } from './u.shared.ts';

type Deps = {
  readonly which?: typeof Process.invoke;
  readonly realPath?: typeof Fs.realPath;
  readonly execPath?: () => string;
  readonly home?: () => string | undefined;
};

export async function detect(
  input: t.DenoVersion.Input = {},
  deps: Deps = {},
): Promise<t.DenoVersion.Authority.Result> {
  try {
    const path = await resolvePath(input, deps);
    return ok({
      kind: toAuthorityKind(path, deps.home?.() ?? Deno.env.get('HOME')?.trim()),
      path,
    });
  } catch (cause) {
    return fail('Failed to resolve Deno runtime upgrade authority.', cause);
  }
}

export const detectLib: t.DenoVersion.Authority.Lib['detect'] = detect;

export function toAuthorityKind(
  path: t.StringPath | undefined,
  home = Deno.env.get('HOME')?.trim(),
): t.DenoVersion.Authority.Kind {
  if (!path) return 'unknown';

  const normalized = normalize(path);
  if (isBrewPath(normalized)) return 'brew';
  if (isDenoUpgradePath(normalized, home)) return 'deno-upgrade';
  return 'unknown';
}

async function resolvePath(
  input: t.DenoVersion.Input,
  deps: Deps,
): Promise<t.StringPath | undefined> {
  const cmd = input.cmd?.trim();
  if (!cmd || cmd === 'deno') {
    return await canonicalize((deps.execPath ?? Deno.execPath)(), deps);
  }

  if (Path.Is.absolute(cmd) || cmd.includes('/')) {
    return await canonicalize(Path.Is.absolute(cmd) ? cmd : Path.resolve(input.cwd ?? '.', cmd), deps);
  }

  const output = await (deps.which ?? Process.invoke)({
    cmd: 'which',
    args: [cmd],
    cwd: input.cwd,
    env: input.env,
    silent: true,
  }).catch(() => undefined);

  if (!output?.success) return undefined;
  const path = output.text.stdout.trim().split('\n')[0]?.trim();
  if (!path) return undefined;
  return await canonicalize(path, deps);
}

async function canonicalize(
  path: string | undefined,
  deps: Deps,
): Promise<t.StringPath | undefined> {
  if (!path) return undefined;
  return await (deps.realPath ?? Fs.realPath)(path).catch(() => path as t.StringPath);
}

function isBrewPath(path: string) {
  return path.includes('/Cellar/deno/') || path.includes('/Homebrew/Cellar/deno/');
}

function isDenoUpgradePath(path: string, home?: string) {
  const root = home?.trim();
  if (!root) return false;
  return path === normalize(Path.join(root, '.deno', 'bin', 'deno'));
}

function normalize(path: string) {
  return Path.normalize(path).replace(/\\/g, '/');
}

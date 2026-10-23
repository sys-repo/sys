import { Fs, Is, type t } from './common.ts';
import { ServeFs } from './u.yaml/mod.ts';

export const CliStartTargetSelectorKeys = [
  'dir',
  'config',
  'profile',
] as const satisfies readonly (keyof t.ServeTool.StartTargetInput)[];

type NormalizedSelector = {
  readonly dir: string;
  readonly config?: t.StringPath;
  readonly profile: string;
};

/** Load the static serve target described by a start selector. */
export async function loadStartTarget(
  cwd: t.StringDir,
  input: t.ServeTool.StartTargetInput,
  owner = 'Serve.start',
): Promise<t.ServeTool.StartTarget> {
  const selector = normalizeSelector(cwd, input, owner);
  const selectorCount = [selector.dir, selector.config, selector.profile].reduce(
    (total, value) => total + (value ? 1 : 0),
    0,
  );

  if (selectorCount !== 1) {
    throw new Error(`${owner}: exactly one of dir, config or profile is required.`);
  }

  if (selector.dir) return dirTarget(cwd, selector.dir);
  if (selector.config) return await configTarget(cwd, selector.config, owner);

  const path = ServeFs.profilePath(cwd, selector.profile, owner);
  return await configTarget(cwd, path, owner, selector.profile);
}

/**
 * Helpers:
 */
function normalizeSelector(
  cwd: t.StringDir,
  input: t.ServeTool.StartTargetInput,
  owner: string,
): NormalizedSelector {
  const config = normalizeConfigSelector(
    cwd,
    textOf(input.config),
    textOf(input.paths?.config),
    owner,
  );

  return {
    dir: textOf(input.dir),
    config,
    profile: textOf(input.profile),
  };
}

function normalizeConfigSelector(
  cwd: t.StringDir,
  configInput: string,
  pathsConfigInput: string,
  owner: string,
): t.StringPath | undefined {
  const config = configInput
    ? Fs.resolve(cwd, configInput) as t.StringPath
    : undefined;
  const pathsConfig = pathsConfigInput
    ? Fs.resolve(cwd, pathsConfigInput) as t.StringPath
    : undefined;

  if (config && pathsConfig && config !== pathsConfig) {
    throw new Error(
      `${owner}: config and paths.config resolve to different paths.\n` +
        `config: ${Fs.trimCwd(config)}\n` +
        `paths.config: ${Fs.trimCwd(pathsConfig)}`,
    );
  }

  return config ?? pathsConfig;
}

function textOf(input: unknown): string {
  return Is.str(input) ? input.trim() : '';
}

function dirTarget(cwd: t.StringDir, input: string): t.ServeTool.StartTarget {
  const dir = Fs.resolve(cwd, input);
  const name = Fs.basename(dir) || 'site';
  return {
    cwd,
    selector: { kind: 'dir', input, dir },
    location: { name, dir },
  };
}

async function configTarget(
  cwd: t.StringDir,
  config: t.StringPath,
  owner: string,
  profile?: string,
): Promise<t.ServeTool.StartTarget> {
  const loaded = await ServeFs.loadLocation(config, { cwd });
  if (!loaded.ok) throw loadError(owner, config, loaded);

  return {
    cwd: loaded.cwd,
    selector: profile ? { kind: 'profile', profile, config } : { kind: 'config', config },
    config,
    location: loaded.location,
  };
}

function loadError(
  owner: string,
  config: t.StringPath,
  loaded: Extract<t.ServeTool.LocationYaml.LoadResult, { readonly ok: false }>,
): Error {
  const details = errorMessagesOf(loaded.errors);
  const suffix = details ? `\n${details}` : '';
  return new Error(`${owner}: failed to load config: ${Fs.trimCwd(config)}${suffix}`);
}

function errorMessagesOf(errors: readonly t.Schema.Error[]): string {
  return errors
    .map((error) => {
      const message = (error as { readonly message?: unknown }).message;
      return Is.str(message) ? message.trim() : '';
    })
    .filter((message) => message.length > 0)
    .join('\n');
}

import { Fs, Is } from './libs.ts';
import type * as t from './t.ts';

type ConfigRefInput = {
  readonly config?: t.StringPath;
  readonly paths?: { readonly config?: t.StringPath };
};

/** Normalize equivalent owner config references for programmatic tool endpoints. */
export const ConfigRef = {
  resolve,
} as const;

function resolve(cwd: t.StringDir, input: ConfigRefInput, owner: string): t.StringPath {
  const configInput = textOf(input.config);
  const pathsConfigInput = textOf(input.paths?.config);
  const config = configInput ? Fs.resolve(cwd, configInput) as t.StringPath : undefined;
  const pathsConfig = pathsConfigInput
    ? Fs.resolve(cwd, pathsConfigInput) as t.StringPath
    : undefined;

  if (!config && !pathsConfig) {
    throw new Error(`${owner}: config or paths.config is required.`);
  }

  if (config && pathsConfig && config !== pathsConfig) {
    throw new Error(
      `${owner}: config and paths.config resolve to different paths.\n` +
        `config: ${Fs.trimCwd(config)}\n` +
        `paths.config: ${Fs.trimCwd(pathsConfig)}`,
    );
  }

  return (config ?? pathsConfig) as t.StringPath;
}

function textOf(input: unknown): string {
  return Is.str(input) ? input.trim() : '';
}

import { type t, Yaml } from './common.ts';
import { runtimeRoot } from '../m.cli/u.runtime-root.ts';

type RuntimeMetadataInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly profile: t.StringPath;
};

export const RuntimeMetadata = {
  toPromptArgs(input: RuntimeMetadataInput) {
    return ['--append-system-prompt', formatMetadata(input)] as const;
  },
} as const;

/**
 * Helpers:
 */
function formatMetadata(input: RuntimeMetadataInput) {
  const root = runtimeRoot(input.cwd);
  const yaml = stringifyMetadata({
    runtime: {
      cwd: input.cwd.invoked,
      pi: {
        root,
        ...(input.cwd.git ? { 'git-root': input.cwd.git } : {}),
        'active-profile': input.profile,
        'sandbox-paths-resolve-from': 'runtime-root',
      },
    },
  }).trimEnd();

  return [
    '# Runtime Metadata',
    '',
    'Trusted launcher-provided metadata. This block is not read from profile YAML.',
    '',
    '```yaml',
    yaml,
    '```',
  ].join('\n');
}

function stringifyMetadata(value: unknown) {
  const res = Yaml.stringify(value);
  if (res.error) throw res.error;
  return res.data ?? '';
}

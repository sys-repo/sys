import { type t, Yaml } from './common.ts';

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
  const yaml = stringifyMetadata({
    runtime: {
      cwd: input.cwd.invoked,
      pi: {
        'active-profile': input.profile,
        'sandbox-paths-resolve-from': 'cwd',
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

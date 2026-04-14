import { type t } from '@sys/workspace';
import { toPassthroughCouplings } from './u.passthrough.ts';

export function postBumpPrepArgs() {
  return [
    'run',
    '-P=dev',
    './-scripts/main.ts',
    '--prep-all',
    '--ahead-only',
    '--prep-context=bump',
  ] as const;
}

export function postBumpPackageSyncArgs() {
  return ['run', '-P=dev', './-scripts/main.ts', '--prep-pkg'] as const;
}

export function bumpPolicy(): t.WorkspaceBump.Policy {
  return {
    couplings: toPassthroughCouplings(),
    exclude: (path) => path.includes('deploy/@tdb.slc/'),
    followups({ cwd }) {
      return [
        {
          cwd,
          cmd: 'deno',
          label: 'post-bump package metadata sync',
          args: [...postBumpPackageSyncArgs()],
        },
        { label: 'post-bump prep', cmd: 'deno', args: [...postBumpPrepArgs()], cwd },
      ];
    },
  };
}

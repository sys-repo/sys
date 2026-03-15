import { Str, type t } from './common.ts';

/**
 * Render canonical package metadata module text from `deno.json` values.
 */
export function renderPkg(args: { name: string; version: string }) {
  return `${Str.dedent(`
    import type { Pkg } from '@sys/types';

    /**
     * Package metadata.
     *
     * AUTO-GENERATED:
     *    This file is generated from the package \`deno.json\`
     *    during repo prep. See command:
     *
     *        cd ./<system-repo-root>
     *        deno task prep
     *
     *    - DO check this file in to source control.
     *    - Do NOT manually alter this file.
     */
    export const pkg: Pkg = { name: '${args.name}', version: '${args.version}' };
  `)}
`;
}

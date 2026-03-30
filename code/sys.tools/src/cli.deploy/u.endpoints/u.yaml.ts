import { type t, Fs, Str } from '../common.ts';

/**
 * Canonical starting YAML for a new endpoint.
 * Keep this minimal and schema-aligned.
 */
export function initialYaml(): string {
  return Str.dedent(
    `
      # Shape:
      # - provider     → publish target
      # - source.dir   → optional source base
      # - staging.dir  → local staging root
      # - mappings     → orbiter/shared staged filesystem layout
      # - mapping      → singular deno package target

      # provider:
      #   kind: orbiter
      #   siteId: SITE_ID_HERE
      #   domain: foo

      # provider:
      #   kind: deno
      #   app: APP_NAME_HERE
      #   org: ORG_NAME_HERE
      #   tokenEnv: TOKEN_ENV_HERE
      #   verifyPreview: true
      #
      # mapping:
      #   dir:
      #     source: ./my-app
      #     staging: .

      # source:
      #   dir: .

      staging:
        dir: ./staging
        # clear: false

      mappings: []
      # mappings:
      #   - mode: build+copy
      #     dir:
      #       source: ./my-module
      #       staging: .
      #   - mode: copy
      #     dir:
      #       source: ./my-public
      #       staging: ./public

      `,
  ).trimStart();
}

/**
 * Convenience helper that ensures the initial YAML is present at the given path.
 */
export async function ensureInitialYaml(path: t.StringPath) {
  await Fs.ensureDir(Fs.dirname(path));
  if (await Fs.exists(path)) return;
  await Fs.write(path, initialYaml(), { force: false });
}

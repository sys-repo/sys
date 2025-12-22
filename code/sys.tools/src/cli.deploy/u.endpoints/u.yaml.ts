import { type t, Str, Fs } from '../common.ts';

/**
 * Canonical starting YAML for a new endpoint.
 * Keep this minimal and schema-aligned.
 */
export function initialYaml(name: string): string {
  return Str.dedent(
    `
      # deploy endpoint: ${name}
      #
      # An endpoint is defined by:
      # - optional provider config ("where" it is published)
      # - one or more directory mappings ("what" is staged)
      #
      # Paths:
      # - source  → relative to this YAML file
      # - staging → relative to the deploy config directory

      # provider:
      #   kind: orbiter
      #   siteId: 1efe1393-e2b5-1455-6570-6b7wb03329c7
      #   domain: foo

      mappings: []
      # mappings:
      #   - mode: build+copy # OR copy
      #     dir:
      #       source: ./my-package-module
      #       staging: ./staging/my-output-bundle

      `,
  ).trimStart();
}

/**
 * Convenience helper that ensures the initial YAML is present at the given path.
 */
export async function ensureInitialYaml(path: t.StringPath, name: string) {
  await Fs.ensureDir(Fs.dirname(path));
  if (await Fs.exists(path)) return;
  await Fs.write(path, initialYaml(name), { force: false });
}

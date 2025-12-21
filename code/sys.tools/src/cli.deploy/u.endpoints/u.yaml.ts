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
      # Each mapping stages a local directory into the deploy root.
      # - source  → relative to this YAML file
      # - staging → relative to the deploy config directory

      mappings: []
      # mappings:
      #   - dir:
      #       source: ./my-pkg
      #       staging: ./staging/my-pkg
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

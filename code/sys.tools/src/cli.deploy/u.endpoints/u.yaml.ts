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
      # - required staging root (where staged output is written)
      # - optional provider config ("where" it is published)
      # - one or more directory mappings ("what" is staged)
      #
      # Paths are resolved relative to the CLI cwd and rebased via source.dir / staging.dir.
      # source.dir and staging.dir default to '.' (the base itself).

      # source:
      #   dir: .

      staging:
        dir: ./staging

      # provider:
      #   kind: orbiter
      #   siteId: 1efe1393-e2b5-1455-6570-6b7wb03329c7
      #   domain: foo

      mappings: []
      # mappings:
      #   - mode: build+copy # OR copy
      #     dir:
      #       source: ./my-module
      #       staging: . # or ./some/subdir

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

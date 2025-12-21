import { type t, c, Cli, Fs, indexedMenu, Time } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';

type Result = { readonly kind: 'exit' } | { readonly kind: 'selected'; readonly key: string };

/**
 * Presents an interactive menu for selecting or creating deploy endpoints.
 *
 * Endpoints are persisted units of deployment intent:
 * a stable name, recency metadata, and an evolving configuration.
 *
 * This function owns only:
 * - selection
 * - creation
 * - recency updates
 *
 * All endpoint behavior (providers, execution)
 * is intentionally handled elsewhere.
 */
export async function endpointsMenu(config: t.DeployTool.Config.File): Promise<Result> {
  return await indexedMenu({
    scope: 'deploy:endpoints',
    config,

    adapter: {
      list: (doc) => doc.endpoints ?? [],
      set: (doc, _scope, next) => (doc.endpoints = [...next]),
      keyOf: (e) => e.name,
      lastUsedAtOf: (e) => e.lastUsedAt,
      withLastUsedAt: (e, ts) => ({ ...e, lastUsedAt: ts }),
      labelOf: (e) => [c.cyan(e.name)],

      async add({ config }) {
        const exists = (name: string) =>
          (config.current.endpoints ?? []).some((e) => e.name === name);

        const isValidName = (name: string) => /^[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*$/.test(name);

        const raw = await Cli.Input.Text.prompt({
          message: 'Endpoint display name',
          hint: 'letters, numbers, "." or "-" (e.g. foo.bar-baz)',
          validate(value) {
            const name = String(value ?? '').trim();
            if (!name) return 'Name required.';
            if (!isValidName(name)) {
              return 'Use letters, numbers, "." or "-" only (no spaces, no leading/trailing separators).';
            }
            if (exists(name)) return 'Name already exists.';
            return true;
          },
        });

        const name = raw.trim();
        const file = EndpointsFs.fileOf(name);
        const cwd = Fs.dirname(config.fs.path);
        const yamlAbs = Fs.join(cwd, file);
        await EndpointsFs.ensureInitialYaml(yamlAbs, name);

        config.change((doc) => {
          const now = Time.now.timestamp;
          const current = doc.endpoints ?? [];
          doc.endpoints = [...current, { name, file, createdAt: now, lastUsedAt: now }];
        });

        await config.fs.save();
      },
    },

    ui: {
      message: 'Endpoints:\n',
      prefix: 'deploy:',
      addLabel: '    add: <endpoint>',
    },
  });
}

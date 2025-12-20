import { type t, c, Cli, indexedMenu, Time } from './common.ts';

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
 * All endpoint behavior (mappings, providers, execution)
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

      /**
       * Keep the endpoint label as the name only.
       * Any additional UI detail (paths, providers, etc.) is rendered elsewhere.
       */
      labelOf: (e) => e.name,

      async add({ config }) {
        const exists = (name: string) =>
          (config.current.endpoints ?? []).some((e) => e.name === name);

        const raw = await Cli.Input.Text.prompt({
          message: 'Endpoint name',
          hint: 'e.g. foo.hello-world',
          validate(value) {
            const name = String(value ?? '').trim();
            if (!name) return 'Name required.';
            if (exists(name)) return 'Name already exists.';
            return true;
          },
        });

        const name = raw.trim();

        config.change((doc) => {
          const now = Time.now.timestamp;
          const current = doc.endpoints ?? [];
          doc.endpoints = [...current, { name, createdAt: now, lastUsedAt: now, mappings: [] }];
        });

        await config.fs.save();
      },
    },

    ui: {
      message: 'Endpoints:\n',
      prefix: 'deploy:',
      addLabel: '   add: <endpoint>',

      render(e) {
        const name = Cli.stripAnsi(e.name).trim();
        return { label: c.cyan(name), sortKey: name.toLowerCase() };
      },
    },
  });
}

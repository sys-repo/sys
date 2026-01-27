import { type t, c, Cli, D, Http, Net, Open, Str } from '../common.ts';
import { Mime } from './u.mime.ts';
import { ServeMenu } from './u.prompt.ts';
import { route } from './u.serve.route.ts';

type C = t.ServeTool.Command;
type Opts = { port?: number; host?: 'local' | 'network' };
type ServeResult = { readonly kind: 'back' } | { readonly kind: 'closed' };

/**
 * Start a local HTTP server for the given directory.
 */
export async function startServing(
  cwd: t.StringDir,
  location: t.ServeTool.LocationYaml.Location,
  opts: Opts = {},
): Promise<ServeResult> {
  const { dir } = location;

  // If contentTypes is undefined, allow all MIME types.
  const contentTypes = location.contentTypes ?? (Object.values(Mime.extensionMap) as t.MimeType[]);

  /**
   * Map extensions → MIME types (subset of ServeType).
   */
  const mimeByExt = Mime.extensionMap;
  const app = Http.Server.create({ static: false });

  // Pass the readonly MimeType[] directly to the route factory.
  app.use('*', route({ dir, contentTypes }));

  // Static middleware with restricted MIME table.
  const allowedMimes = new Set<string>(contentTypes);
  const staticMimes: Record<string, string> = Object.fromEntries(
    Object.entries(mimeByExt).filter(([, mime]) => allowedMimes.has(mime)),
  );

  app.use('*', Http.Server.static({ root: dir, mimes: staticMimes }));

  console.info();
  const port = Net.port(opts.port ?? D.port);
  const baseOptions = Http.Server.options({ port, dir, silent: false });
  const ac = new AbortController();
  const host = opts.host ?? 'local';
  const hostname = host === 'network' ? '0.0.0.0' : '127.0.0.1';
  const server = Deno.serve({ ...baseOptions, hostname, signal: ac.signal }, app.fetch);

  /**
   * Run Open → Prompt (Loop)
   */
  const runOpenPromptLoop = (() => {
    const baseUrl = host === 'network' ? `http://0.0.0.0:${port}` : `http://localhost:${port}`;
    const CMD_OPEN = 'bundle:open' satisfies C;
    const PREFIX = `${CMD_OPEN}/`;
    const BACK = 'back' satisfies C;
    let didBack = false;
    let lastSelection: C | undefined;

    const toUrl = (value: C): t.StringUrl => {
      const raw = String(value);
      const subpath = raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw;
      const path = Str.trimLeadingSlashes(subpath);
      return `${baseUrl}/${path}`;
    };

    function renderHeader() {
      const str = Str.builder().blank();

      if (host === 'network') {
        str.line(`  Listening on ${c.cyan('http://')}${c.yellow('0.0.0.0')}${c.cyan(`:${port}/`)}`);
      } else {
        str.line(`  Listening on ${c.cyan(`${baseUrl}/`)}`);
      }

      if (lastSelection) {
        const dir = String(lastSelection).split('/').pop()!;
        const url = `  ${baseUrl}/${dir}`;
        str.line(`             ${c.dim(c.gray(url))}`);
      }

      return String(str.blank());
    }

    return async (): Promise<ServeResult> => {
      const baseMenu = await ServeMenu.bundlesMenuOptions(cwd, location, { includeRoot: true });

      async function promptOnce(): Promise<C> {
        const options = [...baseMenu, { name: c.dim(c.gray('  ← back')), value: BACK }];
        console.clear();
        console.info(renderHeader());
        return (await Cli.Input.Select.prompt({
          message: 'Open',
          options,
          default: lastSelection,
          hideDefault: true,
        })) as C;
      }

      try {
        while (true) {
          const answer = await promptOnce();
          if (answer === BACK) {
            didBack = true;
            break;
          }
          lastSelection = answer;
          Open.invokeDetached(cwd, toUrl(answer));
        }
      } finally {
        ac.abort();
        await server.finished;
      }
      return didBack ? { kind: 'back' } : { kind: 'closed' };
    };
  })();

  return await runOpenPromptLoop();
}

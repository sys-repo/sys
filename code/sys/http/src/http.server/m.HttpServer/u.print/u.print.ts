import { c, Cli, Path, Str, type t } from '../common.host.ts';
import { localOrigin } from '../u/u.origin.ts';
import { statusUrls } from '../u/u.status.url.ts';

type PrintDependencies = {
  readonly isTerminal: t.Cli.Is.Lib['terminal'];
  readonly screenSize: t.Cli.Screen.Lib['size'];
};

const DEFAULT_DEPS: PrintDependencies = {
  isTerminal: Cli.Is.terminal,
  screenSize: Cli.Screen.size,
};

/**
 * Print the server's startup details, URLs, and supplied keyboard hints.
 */
export const print: t.HttpServer.Lib['print'] = (options) => printWithOrigin(options);

/** Print startup details, optionally preserving an origin resolved during startup. */
export function printWithOrigin(options: t.HttpServer.Print.Options, settledOrigin?: t.StringUrl) {
  printWith(DEFAULT_DEPS, options, settledOrigin);
}

/** Print startup details with supplied terminal detection and sizing. */
export function printWith(
  deps: PrintDependencies,
  options: t.HttpServer.Print.Options,
  settledOrigin?: t.StringUrl,
) {
  const { addr, pkg, hash, name, requestedPort, formatDetail } = options;
  const root = options.status?.root ?? options.dir;
  const ownerDetails = options.status?.details ?? infoDetails(options.info);
  const details = [...ownerDetails];
  const portFallback = formatPortFallback({ requestedPort, actualPort: addr.port });
  const digest = pkg ? wrangle.hashDigest(hash) : '';
  if (digest) details.push({ label: 'dist', value: `${digest} ← dist/dist.json` });
  if (portFallback) details.push({ label: 'port', value: portFallback });

  const presentation = ownerPresentation(ownerDetails, formatDetail);
  const terminal = deps.isTerminal('stdout');
  const width = terminal ? deps.screenSize().width : undefined;

  const serviceName = name ?? options.status?.kind ?? 'http';
  const module = moduleLabel(pkg);
  const status: t.Service.Status = {
    state: 'ready',
    ...(root ? { root: trimCwd(root) } : {}),
    details,
    urls: statusUrls(settledOrigin ?? localOrigin(addr), options.status?.urlPaths),
  };
  const input: t.Cli.Fmt.Service.Input = {
    name: serviceName,
    module,
    status,
    presentation,
    keyboard: options.keyboard,
    urlDisplay: { ipv4Loopback: settledOrigin ? 'exact' : 'localhost' },
  };
  const output = Cli.Fmt.Service.format(input, { terminal, width });

  if (wrangle.shouldPrintDivider()) {
    const rule = width === undefined ? Cli.Fmt.hr() : Cli.Fmt.hr({ width });
    console.info(c.dim(c.gray(rule)));
  }
  console.info(`\n${Str.trimEdgeNewlines(output)}\n`);
}

/**
 * Helpers:
 */
function moduleLabel(pkg: t.Pkg | undefined): string | undefined {
  if (!pkg) return;
  const name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
  const version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
  return `${name} ${version}`;
}

function ownerPresentation(
  details: readonly t.Service.Detail[],
  format: t.HttpServer.Print.FormatDetail | undefined,
): t.Cli.Fmt.Service.Presentation | undefined {
  const ownerFacts = new Set(details);
  if (format === undefined) return;
  return {
    formatDetail(args) {
      // Generated rows may have identical text; only caller-supplied details use the callback.
      if (!ownerFacts.has(args.detail)) return;
      return format(args);
    },
  };
}

function infoDetails(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
  return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
}

function trimCwd(input: string): string {
  if (Path.Is.relative(input)) return input.replace(/^\.\//, '');
  const cwd = Deno.cwd();
  const prefix = cwd.endsWith('/') ? cwd : `${cwd}/`;
  if (input === cwd) return '';
  return input.startsWith(prefix) ? input.slice(prefix.length) : input;
}

function formatPortFallback(input: { requestedPort?: number; actualPort: number }) {
  const { requestedPort, actualPort } = input;
  if (!requestedPort || requestedPort === actualPort) return '';
  return `${requestedPort} already in use; using ${actualPort}`;
}

let printSink: typeof console.info | undefined;
let hasPrintedToSink = false;

const wrangle = {
  shouldPrintDivider() {
    const sink = console.info;
    if (sink !== printSink) {
      printSink = sink;
      hasPrintedToSink = false;
    }
    const shouldPrint = hasPrintedToSink;
    hasPrintedToSink = true;
    return shouldPrint;
  },

  hashDigest(hash?: string) {
    if (!hash) return '';
    if (hash.length <= 18) return hash;
    return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
  },
} as const;

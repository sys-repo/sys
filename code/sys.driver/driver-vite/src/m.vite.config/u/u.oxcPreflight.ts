import type { ResolvedConfig } from 'vite';
import { Is, Path, Str, type t } from '../common.ts';
import { browserSyntaxTargets } from './u.browserSyntaxTargets.ts';

type TransformWithOxc = (
  ...args: Parameters<typeof import('vite').transformWithOxc>
) => Promise<unknown>;
type ViteRuntime = { transformWithOxc: TransformWithOxc };

type Options = {
  /** Test seam. Production loads the active Vite runtime. */
  load?: () => Promise<ViteRuntime>;
  /** Test seam. */
  filename?: string;
  /** Test seam. */
  source?: string;
};

const DEFAULT_SOURCE = Str.dedent(`
  const value: number = 1;
  using resource = { [Symbol.dispose]() {} };
  void resource;
  export const SysOxcPreflight = () => <div data-sys-oxc-preflight>{value}</div>;
`);

/**
 * Prove Vite's OXC native transform path during startup, before app modules are served.
 *
 * This is intentionally private driver infrastructure: no fallback, no OXC disablement,
 * just an early invariant check/warmup for the same `transformWithOxc` path Vite uses.
 */
export function oxcPreflightPlugin(options: Options = {}): t.VitePlugin {
  return {
    name: 'sys:oxc-preflight',
    async configResolved(config) {
      if (config.oxc === false) return;
      await preflight(config, options);
    },
  };
}

async function preflight(config: ResolvedConfig, options: Options) {
  const runtime = await (options.load ?? loadVite)();
  const filename = options.filename ?? Path.join(config.root, '-sys.oxc-preflight.tsx');
  const source = options.source ?? DEFAULT_SOURCE;

  try {
    await runtime.transformWithOxc(
      source,
      filename,
      transformOptions(config.oxc),
      undefined,
      config,
    );
  } catch (cause) {
    throw preflightError(config, filename, cause);
  }
}

async function loadVite(): Promise<ViteRuntime> {
  return await import('vite');
}

function transformOptions(oxc: ResolvedConfig['oxc']) {
  const {
    include: _include,
    exclude: _exclude,
    jsxInject: _jsxInject,
    jsxRefreshInclude: _jsxRefreshInclude,
    jsxRefreshExclude: _jsxRefreshExclude,
    ...options
  } = Is.object(oxc) ? oxc : {};

  return {
    sourcemap: true,
    target: browserSyntaxTargets(),
    ...options,
    lang: 'tsx' as const,
  };
}

function preflightError(config: ResolvedConfig, filename: string, cause: unknown) {
  const context = Str.dedent(`
    OXC preflight failed.

    Vite/Rolldown native transform did not pass startup preflight in this Deno child process.
    The dev server has not been declared healthy; no fallback or OXC disablement was applied.

    plugin: sys:oxc-preflight
    root: ${config.root}
    file: ${filename}

    cause:
  `);
  return new Error(`${context}\n${errorText(cause)}`, { cause });
}

function errorText(input: unknown) {
  if (Is.error(input)) return input.stack || input.message;
  if (Is.string(input)) return input;
  return Deno.inspect(input, { depth: 4, colors: false });
}

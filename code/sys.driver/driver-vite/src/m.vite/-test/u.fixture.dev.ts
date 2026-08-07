import { Log as WorkspaceLog } from '../../m.vite.config.workspace/u.log.ts';
import { type t } from '../common.ts';

export function processEvent(source: t.Process.StdStream, text: string): t.Process.Event {
  return {
    source,
    data: new TextEncoder().encode(text),
    toString: () => text,
  };
}

export function paths(): t.ViteConfig.Paths {
  return {
    cwd: '/tmp/pkg',
    app: {
      entry: 'src/index.html',
      outDir: 'dist',
      base: './',
    },
  };
}

export function pkg(): t.Pkg {
  return {
    name: '@sys/example',
    version: '0.0.0',
  };
}

export function workspace(text = 'workspace-render'): t.ViteDenoWorkspace {
  return {
    exists: true,
    dir: '/tmp/pkg',
    file: '/tmp/pkg/deno.json',
    children: [],
    modules: { ok: true, items: [], count: 0, latest },
    aliases: [],
    toAliasMap: () => ({}),
    toString: () => text,
    log: () => {},
  };
}

export function workspaceWithAliases(): t.ViteDenoWorkspace {
  const ws = {
    exists: true,
    dir: '/repo',
    file: '/repo/deno.json',
    children: [],
    modules: { ok: true, items: [], count: 0, latest },
    aliases: [
      {
        find: '@sys/driver-automerge/client',
        replacement: '/repo/code/sys.driver/driver-automerge/src/-exports/-ws.client.ts',
      },
      {
        find: '@sys/driver-automerge/types',
        replacement: '/repo/code/sys.driver/driver-automerge/src/types.ts',
      },
    ],
    toAliasMap: () => ({}),
    toString(options?: { pad?: boolean; width?: number }) {
      return WorkspaceLog.toString(this, options);
    },
    log() {},
  } satisfies t.ViteDenoWorkspace;

  return ws;
}

/**
 * Helpers:
 */
type EsmImportMap = { [key: string]: string };
function latest(name: t.StringModuleSpecifier): t.StringSemver;
function latest(deps: EsmImportMap): EsmImportMap;
function latest(input: t.StringModuleSpecifier | EsmImportMap): t.StringSemver | EsmImportMap {
  return typeof input === 'string' ? '0.0.0' : input;
}

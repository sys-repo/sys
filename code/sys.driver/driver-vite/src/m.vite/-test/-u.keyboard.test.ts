import { describe, expect, it } from '../../-test/common.ts';
import type { t } from '../common.ts';
import { keyboardFactory } from '../u.keyboard.ts';

describe('Vite.dev keyboard', () => {
  it('handles info redraw before quit without losing the dispose path', async () => {
    const events: string[] = [];
    const keyboard = keyboardFactory({
      paths: paths(),
      port: 1234,
      url: 'http://localhost:1234/',
      pkg: pkg(),
      dispose: async () => {
        events.push('dispose');
      },
    }, {
      keypress: () => keypress([{ key: 'i' }, { key: 'c', ctrlKey: true }]),
      workspace: async () => workspace(),
      clear: () => events.push('clear'),
      print: (text) => events.push(text.includes('Options') ? 'help' : 'info'),
      exit: (code) => events.push(`exit:${code}`),
    });

    await keyboard();

    expect(events).to.eql(['clear', 'help', 'dispose', 'exit:0']);
  });

  it('renders extended info for shift+i before the plain info branch', async () => {
    const events: string[] = [];
    const keyboard = keyboardFactory({
      paths: paths(),
      port: 1234,
      url: 'http://localhost:1234/',
      pkg: pkg(),
      dispose: async () => {},
    }, {
      keypress: () => keypress([{ key: 'i', shiftKey: true }]),
      workspace: async () => workspace(),
      clear: () => events.push('clear'),
      print: (text) => events.push(text.includes('workspace-render') ? 'extended' : 'plain'),
      exit: (_code) => {},
    });

    await keyboard();

    expect(events).to.eql(['clear', 'extended']);
  });
});

function keypress(items: readonly KeypressInput[]) {
  return (async function* () {
    for (const item of items) yield event(item);
  })();
}

type KeypressInput = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
};

function event(input: KeypressInput) {
  return {
    key: input.key,
    ctrlKey: input.ctrlKey ?? false,
    shiftKey: input.shiftKey ?? false,
  };
}

function paths(): t.ViteConfigPaths {
  return {
    cwd: '/tmp/pkg',
    app: {
      entry: 'src/index.html',
      outDir: 'dist',
      base: './',
    },
  };
}

function pkg(): t.Pkg {
  return {
    name: '@sys/example',
    version: '0.0.0',
  };
}

function workspace(): t.ViteDenoWorkspace {
  type EsmImportMap = { readonly [key: string]: string };
  function latest(name: t.StringModuleSpecifier): t.StringSemver;
  function latest(deps: EsmImportMap): EsmImportMap;
  function latest(input: t.StringModuleSpecifier | EsmImportMap): t.StringSemver | EsmImportMap {
    return typeof input === 'string' ? '0.0.0' : input;
  }
  return {
    exists: true,
    dir: '/tmp/pkg',
    file: '/tmp/pkg/deno.json',
    children: [],
    modules: { ok: true, items: [], count: 0, latest },
    aliases: [],
    toAliasMap: () => ({}),
    toString: () => 'workspace-render',
    log: () => {},
  };
}

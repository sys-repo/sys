import { describe, expect, Is, it, Json } from '../../../-test.ts';
import { DisposeProtocolCompatPlugin } from '../mod.ts';
import { context, moduleParsedHook, resolveHook, transformHook } from './u.fixture.ts';

const COMPAT_SPECIFIER = '@sys/std/dispose/compat';
const COMPAT_IMPORT = `import '${COMPAT_SPECIFIER}';`;

describe('DisposeProtocolCompatPlugin', () => {
  it('declares the pre-enforced client-only boundary', () => {
    const plugin = DisposeProtocolCompatPlugin.plugin();
    expect(plugin.name).to.eql('sys:dispose-protocol-compat');
    expect(plugin.enforce).to.eql('pre');

    const apply = plugin.applyToEnvironment;
    if (!apply) throw new Error('Expected applyToEnvironment hook');
    expect(apply({ name: 'client', config: { consumer: undefined } } as never)).to.eql(true);
    expect(apply({ name: 'ssr', config: { consumer: 'server' } } as never)).to.eql(false);
  });

  it('injects one side-effect import with a high-resolution source map', async () => {
    const transform = transformHook(DisposeProtocolCompatPlugin.plugin());
    const input = 'export const value: number = 1;\n';
    const result = await transform.call(context(), input, '/tmp/mod.ts?direct');

    if (!result) throw new Error('Expected transform result');
    expect(result.code).to.eql(`${COMPAT_IMPORT}\n${input}`);
    expect(result.moduleSideEffects).to.eql(true);
    expect(Is.object(result.map)).to.eql(true);
    expect(result.map.sources).to.eql(['/tmp/mod.ts']);
    expect(result.map.sourcesContent).to.eql([input]);
    expect(result.map.mappings?.length).to.be.greaterThan(0);
  });

  it('preserves a hashbang and parses TypeScript and JSX module kinds', async () => {
    const transform = transformHook(DisposeProtocolCompatPlugin.plugin());
    const ctx = context();
    const tsx = await transform.call(ctx, 'export const view = <div />;\n', '/tmp/view.tsx');
    const script = await transform.call(
      ctx,
      '#!/usr/bin/env node\nexport const value = 1;\n',
      '/tmp/mod.mjs',
    );

    if (!tsx) throw new Error('Expected TSX transform result');
    if (!script) throw new Error('Expected hashbang result');
    expect(tsx.code).to.eql(`${COMPAT_IMPORT}\nexport const view = <div />;\n`);
    expect(script.code).to.eql(`#!/usr/bin/env node\n${COMPAT_IMPORT}\nexport const value = 1;\n`);
  });

  it('runs before OXC and exposes the compatibility import to later transforms', async () => {
    const transform = transformHook(DisposeProtocolCompatPlugin.plugin());
    let observed = '';
    const laterOxcTransform = (code: string) => {
      observed = code;
      return code;
    };

    const result = await transform.call(context(), 'using value = acquire();', '/tmp/mod.ts');
    if (!result) throw new Error('Expected transform result');
    laterOxcTransform(result.code);

    expect(observed.startsWith(`${COMPAT_IMPORT}\n`)).to.eql(true);
    expect(observed).to.include('using value = acquire();');
  });

  it('recognizes only an actual top-level side-effect import as prior injection', async () => {
    const transform = transformHook(DisposeProtocolCompatPlugin.plugin());
    const ctx = context();
    const injected = `${COMPAT_IMPORT}\nexport const value = 1;`;
    const lookalikes = [
      `// ${COMPAT_IMPORT}\nexport const value = 1;`,
      `const text = ${Json.stringify(COMPAT_IMPORT)};`,
      `import { Dispose } from '${COMPAT_SPECIFIER}';`,
    ];

    expect(await transform.call(ctx, injected, '/tmp/mod.ts')).to.eql(null);
    for (const code of lookalikes) {
      const result = await transform.call(ctx, code, '/tmp/mod.ts');
      if (!result) throw new Error('Expected transform result');
      expect(result.code.startsWith(`${COMPAT_IMPORT}\n`)).to.eql(true);
    }
  });

  it('ignores unsupported module kinds and virtual modules', async () => {
    const transform = transformHook(DisposeProtocolCompatPlugin.plugin());
    expect(await transform.call(context(), 'body {}', '/tmp/style.css')).to.eql(null);
    expect(await transform.call(context(), 'export const value = 1;', '\0virtual.ts')).to.eql(null);
    expect(
      await transform.call(context(), 'export const value = 1;', '\0npm:pkg@1.0.0/mod.js'),
    ).to.eql(null);
  });

  it('excludes the resolved compatibility entrypoint and its static dependency closure', async () => {
    const plugin = DisposeProtocolCompatPlugin.plugin();
    const resolve = resolveHook(plugin);
    const transform = transformHook(plugin);
    const root = '/workspace/code/sys/std/src/m.Dispose/m.Compat/mod.ts';
    const installer = '/workspace/code/sys/std/src/m.Dispose/u.protocolSymbols.ts';
    const predicate = '/workspace/code/sys/std/src/common/u.is.ts';
    const resolved = new Map([
      [COMPAT_SPECIFIER, root],
      ['../u.protocolSymbols.ts', installer],
      ['../common/u.is.ts', predicate],
    ]);
    const ctx = context(async (source) => {
      const id = resolved.get(source);
      return id ? { id } : null;
    });

    await resolve.call(ctx, COMPAT_SPECIFIER, '/workspace/src/main.ts', { isEntry: false });
    await resolve.call(ctx, '../u.protocolSymbols.ts', root, { isEntry: false });
    await resolve.call(ctx, '../common/u.is.ts', installer, { isEntry: false });

    expect(await transform.call(ctx, "import '../u.protocolSymbols.ts';", root)).to.eql(null);
    expect(await transform.call(ctx, "import '../common/u.is.ts';", installer)).to.eql(null);
    expect(await transform.call(ctx, 'export const isSymbol = () => true;', predicate)).to.eql(
      null,
    );

    const ordinary = await transform.call(ctx, 'export const value = 1;', '/workspace/src/main.ts');
    if (!ordinary) throw new Error('Expected transform result');
    expect(ordinary.code.startsWith(COMPAT_IMPORT)).to.eql(true);
  });

  it('excludes the compatibility root when transform runs before import resolution', async () => {
    const plugin = DisposeProtocolCompatPlugin.plugin();
    const transform = transformHook(plugin);
    const root = '/workspace/compat.ts';
    const ctx = context(async (source) => source === COMPAT_SPECIFIER ? { id: root } : null);

    expect(await transform.call(ctx, 'export const root = true;', root)).to.eql(null);
  });

  it('extends bootstrap exclusion from parsed static dependency ids', async () => {
    const plugin = DisposeProtocolCompatPlugin.plugin();
    const resolve = resolveHook(plugin);
    const parsed = moduleParsedHook(plugin);
    const transform = transformHook(plugin);
    const root = '/workspace/compat.ts';
    const nested = '/workspace/nested.ts';
    const deep = '/workspace/deep.ts';
    const ctx = context(async (source) => source === COMPAT_SPECIFIER ? { id: root } : null);

    await resolve.call(ctx, COMPAT_SPECIFIER, '/workspace/main.ts', { isEntry: false });
    parsed.call(ctx, { id: root, importedIds: [nested] });
    parsed.call(ctx, { id: nested, importedIds: [deep] });

    expect(await transform.call(ctx, 'export const root = true;', root)).to.eql(null);
    expect(await transform.call(ctx, 'export const nested = true;', nested)).to.eql(null);
    expect(await transform.call(ctx, 'export const deep = true;', deep)).to.eql(null);
  });
});

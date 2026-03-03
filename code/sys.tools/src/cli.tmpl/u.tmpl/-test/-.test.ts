import { describe, expect, it } from '../../../-test.ts';
import { type t, Process, Fs, TmplEngine } from '../../common.ts';
import { applyTemplateVariant, makeBaseTemplateProcessor } from '../mod.ts';
import {
  registerHostRootRegistry,
  registerHostTypeBarrels,
  resolveTemplateRootFromImport,
} from '../u.clone.ts';

describe('tool: Tmpl/u.tmpl', () => {
  it('resolves template root from u.tmpl import path', async () => {
    const url = new URL('../u.clone.ts', import.meta.url).href;
    const root = resolveTemplateRootFromImport(url);
    expect(await Fs.exists(Fs.join(root, 'm.cli.ts'))).to.eql(true);
    expect(await Fs.exists(Fs.join(root, 't.namespace.ts'))).to.eql(true);
    expect(await Fs.exists(Fs.join(root, 'common.ts'))).to.eql(true);
  });

  it('registers generated tool types in host barrels (idempotent)', async () => {
    const tmp = await Fs.makeTempDir();
    const host = tmp.absolute as t.StringDir;
    const target = Fs.join(host, 'FOO_TMP') as t.StringDir;
    const commonT = Fs.join(host, 'common/t.ts');
    const types = Fs.join(host, 'types.ts');

    try {
      await Fs.ensureDir(Fs.dirname(commonT));
      await Fs.write(commonT, `export type * from '../cli.video/t.ts';\n`);
      await Fs.write(types, `export type { VideoTool } from './cli.video/t.namespace.ts';\n`);

      await registerHostTypeBarrels({ targetDir: target, toolName: 'Foo' });
      await registerHostTypeBarrels({ targetDir: target, toolName: 'Foo' });

      const commonText = (await Fs.readText(commonT)).data ?? '';
      const typesText = (await Fs.readText(types)).data ?? '';
      const commonLine = `export type * from '../FOO_TMP/t.ts';`;
      const typesLine = `export type { FooTool } from './FOO_TMP/t.namespace.ts';`;

      expect(commonText.includes(commonLine)).to.eql(true);
      expect(typesText.includes(typesLine)).to.eql(true);
      expect(occurrences(commonText, commonLine)).to.eql(1);
      expect(occurrences(typesText, typesLine)).to.eql(1);
    } finally {
      await Fs.remove(host);
    }
  });

  it('registers generated tool in root registry seams (idempotent)', async () => {
    const tmp = await Fs.makeTempDir();
    const host = tmp.absolute as t.StringDir;
    const target = Fs.join(host, 'FOO_TMP') as t.StringDir;
    const rootNamespace = Fs.join(host, 't.namespace.ts');
    const rootRegistry = Fs.join(host, 'u.root/registry.ts');

    try {
      await Fs.ensureDir(Fs.dirname(rootRegistry));
      await Fs.write(
        rootNamespace,
        `
export namespace Tools {
  export type Command =
    | t.VideoTool.Id;
}
        `.trimStart(),
      );
      await Fs.write(
        rootRegistry,
        `
type ToolRegistryItem = unknown;
export const ROOT_REGISTRY = [
  { id: 'video', aliases: undefined, load: () => import('../cli.video/mod.ts') },
] as const satisfies readonly ToolRegistryItem[];
        `.trimStart(),
      );

      await registerHostRootRegistry({ targetDir: target, toolName: 'Foo', toolId: 'foo' });
      await registerHostRootRegistry({ targetDir: target, toolName: 'Foo', toolId: 'foo' });

      const nsText = (await Fs.readText(rootNamespace)).data ?? '';
      const regText = (await Fs.readText(rootRegistry)).data ?? '';
      const nsLine = `| t.FooTool.Id;`;
      const regLine = `  { id: 'foo', aliases: undefined, load: () => import('../FOO_TMP/mod.ts') },`;

      expect(nsText.includes(nsLine)).to.eql(true);
      expect(regText.includes(regLine)).to.eql(true);
      expect(occurrences(nsText, nsLine)).to.eql(1);
      expect(occurrences(regText, regLine)).to.eql(1);
    } finally {
      await Fs.remove(host);
    }
  });

  it('applies yaml variant overlay to generated files', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;
    const name = 'Demo';

    try {
      const src = Fs.dirname(Fs.Path.fromFileUrl(import.meta.url));
      const tmplRoot = Fs.dirname(Fs.dirname(src));
      const nsTemplate = (await Fs.readText(Fs.join(tmplRoot, 't.namespace.ts'))).data ?? '';
      const cliTemplate = (await Fs.readText(Fs.join(tmplRoot, 'm.cli.ts'))).data ?? '';
      const commonTemplate = (await Fs.readText(Fs.join(tmplRoot, 'common.ts'))).data ?? '';
      await Fs.write(Fs.join(dir, 't.namespace.ts'), nsTemplate.replaceAll('Tmpl', name));
      await Fs.write(Fs.join(dir, 'm.cli.ts'), cliTemplate.replaceAll('Tmpl', name));
      await Fs.write(Fs.join(dir, 'common.ts'), commonTemplate.replaceAll('Tmpl', name));

      await applyTemplateVariant({ dir, variant: 'yaml', name });

      const ns = (await Fs.readText(Fs.join(dir, 't.namespace.ts'))).data ?? '';
      const cli = (await Fs.readText(Fs.join(dir, 'm.cli.ts'))).data ?? '';

      expect(ns.includes('export namespace ConfigYaml')).to.eql(true);
      expect(cli.includes(`import { ${name}Migrate } from './u.yaml/mod.ts';`)).to.eql(true);
      expect(cli.includes('const picked = await yamlConfigsMenu(cwd);')).to.eql(true);

      expect(await Fs.exists(Fs.join(dir, 'u.yaml/mod.ts'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'u.yaml/u.fs.ts'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'u.yaml/u.schema.ts'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'u.yaml/u.validate.ts'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'u.yaml/u.migrate.ts'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'u.menu.yaml.ts'))).to.eql(true);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('generated variants pass deno check', async () => {
    const src = Fs.dirname(Fs.Path.fromFileUrl(import.meta.url));
    const tmplRoot = Fs.dirname(Fs.dirname(src));
    const srcRoot = Fs.dirname(tmplRoot);
    const moduleRoot = Fs.dirname(srcRoot);
    const srcCommonUrl = Fs.Path.toFileUrl(Fs.join(srcRoot, 'common.ts')).href;
    const srcCommonTypesUrl = Fs.Path.toFileUrl(Fs.join(srcRoot, 'common/t.ts')).href;

    const run = async (variant: t.TmplTool.TemplateVariant) => {
      const tmp = await Fs.makeTempDir();
      const root = tmp.absolute as t.StringDir;
      const target = Fs.join(root, 'tool') as t.StringDir;
      const name = 'Tool';

      try {
        await Fs.write(
          Fs.join(root, 't.ts'),
          `
export type * from '${srcCommonTypesUrl}';
export type * from './tool/t.ts';
          `.trimStart(),
        );

        await Fs.write(
          Fs.join(root, 'common.ts'),
          `
export * from '${srcCommonUrl}';
export { Schema } from '@sys/schema';
export type * as t from './t.ts';
          `.trimStart(),
        );

        const processor = makeBaseTemplateProcessor({ name });
        await TmplEngine.makeTmpl(tmplRoot, processor).write(target, { force: true });
        await applyTemplateVariant({ dir: target, variant, name });

        const file = Fs.join(target, 'mod.ts');
        const res = await Process.invoke({
          cmd: 'deno',
          args: ['check', '--config', Fs.join(moduleRoot, 'deno.json'), file],
          cwd: moduleRoot,
          silent: true,
        });
        expect(res.success, `Check ${file}\n${res.text.stderr}`).to.eql(true);
      } finally {
        await Fs.remove(root);
      }
    };

    await run('stateless');
    await run('yaml');
  });
});

function occurrences(text: string, pattern: string): number {
  return text.split(pattern).length - 1;
}

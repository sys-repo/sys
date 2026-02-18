import { describe, expect, it } from '../../../-test.ts';
import { type t, Process, Fs, TmplEngine } from '../../common.ts';
import { applyTemplateVariant, makeBaseTemplateProcessor } from '../mod.ts';

describe('tool: __NAME__/u.tmpl', () => {
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
      await Fs.write(Fs.join(dir, 't.namespace.ts'), nsTemplate.replaceAll('__NAME__', name));
      await Fs.write(Fs.join(dir, 'm.cli.ts'), cliTemplate.replaceAll('__NAME__', name));
      await Fs.write(Fs.join(dir, 'common.ts'), commonTemplate.replaceAll('__NAME__', name));

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

    const run = async (variant: t.__NAME__Tool.TemplateVariant) => {
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

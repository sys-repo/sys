import { describe, expect, it } from '../../-test.ts';
import { D, Fs } from '../common.ts';
import type { t } from '../common.ts';
import { applyTemplateVariant } from '../u.tmpl.variant.ts';

describe('tool: __NAME__', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.__NAME__Tool.Id;
    type Name = t.__NAME__Tool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('__NAME__');
    expect(name).to.eql('system/__NAME__:tools');
  });

  describe('sub-templates', () => {
    it('applies yaml variant overlay to generated files', async () => {
      const tmp = await Fs.makeTempDir();
      const dir = tmp.absolute as t.StringDir;
      const name = 'Demo';

      try {
        const src = Fs.dirname(Fs.Path.fromFileUrl(import.meta.url));
        const templateRoot = Fs.dirname(src);
        const nsTemplate = (await Fs.readText(Fs.join(templateRoot, 't.namespace.ts'))).data ?? '';
        const cliTemplate = (await Fs.readText(Fs.join(templateRoot, 'm.cli.ts'))).data ?? '';
        await Fs.write(Fs.join(dir, 't.namespace.ts'), nsTemplate.replaceAll('__NAME__', name));
        await Fs.write(Fs.join(dir, 'm.cli.ts'), cliTemplate.replaceAll('__NAME__', name));

        await applyTemplateVariant({ dir, variant: 'yaml', name });

        const ns = (await Fs.readText(Fs.join(dir, 't.namespace.ts'))).data ?? '';
        const cli = (await Fs.readText(Fs.join(dir, 'm.cli.ts'))).data ?? '';

        expect(ns.includes('export namespace ConfigYaml')).to.eql(true);
        expect(cli.includes(`import { ${name}Migrate } from './u.yaml/mod.ts';`)).to.eql(true);
        expect(cli.includes(`const picked = await yamlConfigsMenu(cwd);`)).to.eql(true);

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
  });
});

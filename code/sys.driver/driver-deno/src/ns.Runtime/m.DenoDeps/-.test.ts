import { describe, expect, Fs, it } from '../../-test.ts';
import { DenoDeps } from './mod.ts';

describe('DenoDeps', () => {
  const SAMPLE = {
    path: './src/-test/sample-2/imports.yaml',
  } as const;

  describe('fromYaml', () => {
    it('input: path (string)', async () => {
      const res = await DenoDeps.fromYaml(SAMPLE.path);
      const imports = res.data?.imports ?? [];

      expect(res.error).to.eql(undefined);
      expect(imports.length).to.be.greaterThan(3);

      expect(imports[0].target).to.eql(['deno.json', 'package.json']);
      expect(imports[1].target).to.eql(['deno.json']);
      expect(imports[2].target).to.eql(['deno.json']);
      expect(imports[3].target).to.eql(['deno.json']);
      expect(imports[4].target).to.eql(['package.json']);

      const mod = imports[0].module;
      expect(mod.input).to.eql('jsr:@std/async@1.0.10');
      expect(mod.name).to.eql('@std/async');
      expect(mod.version).to.eql('1.0.10');
      expect(mod.prefix).to.eql('jsr');
    });

    it('input: YAML (string)', async () => {
      const path = SAMPLE.path;
      const yaml = (await Fs.readText(path)).data!;
      const a = await DenoDeps.fromYaml(yaml);
      const b = await DenoDeps.fromYaml(path);
      expect(a).to.eql(b);
      expect(a.error).to.eql(undefined);
      expect(b.error).to.eql(undefined);
    });

    describe('errors', () => {
      it('path: not found', async () => {
        const path = './404.yaml';
        const res = await DenoDeps.fromYaml(path);
        expect(res.error?.message).to.include('Failed to load YAML at path:');
        expect(res.error?.message).to.include(Fs.resolve(path));
      });

      it('invalid YAML: parse error', async () => {
        const yaml = `
          imports:
            import: jsr:@sys/tmp@0.0.42
            import: npm:rxjs@7
      `;
        const res = await DenoDeps.fromYaml(yaml);
        expect(res.error?.message).to.include('Failed while parsing given YAML');
        expect(res.error?.cause?.message).to.include('Map keys must be unique');
      });

      it('invalid YAML: {imports} not found', async () => {
        const res = await DenoDeps.fromYaml('foo:123');
        expect(res.error?.message).to.includes('Invalid YAML: the {imports} array not found');
      });

      it('invalid YAML: module ESM unparsable', async () => {
        const yaml = `
          imports:
            - import: jsr:@sys/tmp@0.0.42
            - import: fail:foobar@0.1.2        
        `;
        const res = await DenoDeps.fromYaml(yaml);
        expect(res.error?.message).to.include('Failed to parse ESM module-specifier');
        expect(res.error?.message).to.include('"fail:foobar@0.1.2"');

        const imports = res.data?.imports ?? [];
        expect(imports[0].module.error).to.eql(undefined);
        expect(imports[1].module.error?.message).to.include(`Failed to parse ESM module-specifier`);
      });
    });
  });
});

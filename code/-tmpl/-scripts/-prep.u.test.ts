import { describe, expect, it } from '@sys/testing/server';
import { syncTemplateImports, syncTemplatePackage } from './-prep.u.ts';

describe('prep.u', () => {
  it('syncTemplateImports → updates @sys preset/tools/tmpl versions', () => {
    const input = {
      imports: {
        '@sys/preset/core': 'jsr:@sys/preset@0.0.0/core',
        '@sys/preset/ext': 'jsr:@sys/preset@0.0.0/ext',
        '@sys/tools': 'jsr:@sys/tools@0.0.252',
        '@sys/tmpl': 'jsr:@sys/tmpl@0.0.252',
        '@sys/other': 'jsr:@sys/other@1.0.0',
      },
    };
    const versions = { preset: '0.1.9', tools: '0.2.4', tmpl: '0.3.7' };

    const res = syncTemplateImports(input, versions);
    expect(res.imports['@sys/preset/core']).to.eql('jsr:@sys/preset@0.1.9/core');
    expect(res.imports['@sys/preset/ext']).to.eql('jsr:@sys/preset@0.1.9/ext');
    expect(res.imports['@sys/tools']).to.eql('jsr:@sys/tools@0.2.4');
    expect(res.imports['@sys/tmpl']).to.eql('jsr:@sys/tmpl@0.3.7');
    expect(res.imports['@sys/other']).to.eql('jsr:@sys/other@1.0.0');
  });

  it('syncTemplatePackage → syncs dependency versions from root package', () => {
    const input = {
      dependencies: { react: '0.0.0' },
      devDependencies: { vite: '0.0.0' },
    };
    const source = {
      dependencies: { react: '19.2.4' },
      devDependencies: { vite: '7.3.1' },
    };

    const res = syncTemplatePackage(input, source);
    expect(res.dependencies?.react).to.eql('19.2.4');
    expect(res.devDependencies?.vite).to.eql('7.3.1');
  });

  it('syncTemplatePackage → throws when a required key is missing in root package', () => {
    const input = {
      dependencies: { react: '0.0.0' },
      devDependencies: { vite: '0.0.0' },
    };
    const source = { dependencies: { react: '19.2.4' }, devDependencies: {} };

    expect(() => syncTemplatePackage(input, source)).to.throw('Missing dependency "vite" in root package.json');
  });

});

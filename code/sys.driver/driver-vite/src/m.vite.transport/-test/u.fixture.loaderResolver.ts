import { Fs, Path, Str } from '../../-test.ts';

export const DenoLoaderResolverFixture = {
  async create(prefix: string) {
    const fs = await Fs.makeTempDir({ prefix });
    const dir = fs.absolute;
    const rootConfig = Fs.join(dir, 'deno.json');
    const app = Fs.join(dir, 'app.ts');
    const pkgRoot = Fs.join(dir, 'pkg');
    const pkgConfig = Fs.join(pkgRoot, 'deno.json');
    const src = Fs.join(pkgRoot, 'src');
    const feature = Fs.join(src, 'feature.ts');
    const child = Fs.join(src, 'child.ts');
    const json = Fs.join(src, 'data.json');
    const alias = Fs.join(dir, 'alias', 'mod.ts');

    await Fs.writeJson(rootConfig, {
      workspace: ['./pkg'],
      imports: {
        'alias/': './alias/',
        react: 'npm:react@19.2.7',
      },
    });
    await Fs.writeJson(pkgConfig, {
      name: '@fixture/pkg',
      version: '0.0.0',
      exports: {
        '.': './src/feature.ts',
        './feature': './src/feature.ts',
      },
    });
    await Fs.write(
      app,
      Str.dedent(`
        import '@fixture/pkg/feature';
        import 'alias/mod.ts';
        import 'react';
      `),
    );
    await Fs.write(
      feature,
      Str.dedent(`
        import { child } from './child.ts';
        import data from './data.json' with { type: 'json' };
        export const feature = { child, data };
      `),
    );
    await Fs.write(child, "export const child = 'child';\n");
    await Fs.writeJson(json, { name: 'fixture' });
    await Fs.write(alias, "export const alias = 'alias';\n");

    return {
      dir,
      configPath: rootConfig,
      appUrl: Path.toFileUrl(app).href,
      featureUrl: Path.toFileUrl(feature).href,
      childUrl: Path.toFileUrl(child).href,
      jsonUrl: Path.toFileUrl(json).href,
      aliasUrl: Path.toFileUrl(alias).href,
      dispose: async () => await Fs.remove(dir),
    } as const;
  },
} as const;

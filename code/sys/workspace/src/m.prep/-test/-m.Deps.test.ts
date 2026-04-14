import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { WorkspacePrep } from '../mod.ts';

describe('Workspace.Prep.Deps', () => {
  it('projects deps.yaml into imports.json and package.json', async () => {
    const fs = await Testing.dir('WorkspacePrep.Deps.sync');
    const depsPath = Fs.join(fs.dir, 'deps.yaml');
    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), { importMap: 'imports.json' });
    const denoImport = 'jsr:@sys/std@0.0.333';
    const reactImport = 'npm:react@19.2.5';
    const viteImport = 'npm:vite@7.3.2';

    await Fs.write(
      depsPath,
      Str.dedent(`
        deno.json:
          - import: ${denoImport}
            subpaths: [async]
        package.json:
          - import: ${reactImport}
          - import: ${viteImport}
            dev: true
        `),
    );

    type O = Record<string, string>;
    type TImports = { imports?: O };
    type TPackage = { dependencies?: O; devDependencies?: O };

    const result = await WorkspacePrep.Deps.sync({ cwd: fs.dir });
    const imports = await Fs.readJson<TImports>(Fs.join(fs.dir, 'imports.json'));
    const pkg = await Fs.readJson<TPackage>(Fs.join(fs.dir, 'package.json'));

    expect(result.total).to.eql(3);
    expect(result.depsPath).to.eql(depsPath);
    expect(result.deno.denoFilePath).to.eql(Fs.join(fs.dir, 'deno.json'));
    expect(result.deno.targetPath).to.eql(Fs.join(fs.dir, 'imports.json'));
    expect(result.package?.packageFilePath).to.eql(Fs.join(fs.dir, 'package.json'));
    expect(imports.data?.imports).to.eql({
      '@sys/std': denoImport,
      '@sys/std/async': `${denoImport}/async`,
    });
    expect(pkg.data?.dependencies).to.eql({ react: '19.2.5' });
    expect(pkg.data?.devDependencies).to.eql({ vite: '7.3.2' });
  });

  it('emits the canonical import-map summary when log is enabled', async () => {
    const fs = await Testing.dir('WorkspacePrep.Deps.sync.log');
    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), { importMap: 'imports.json' });
    await Fs.write(
      Fs.join(fs.dir, 'deps.yaml'),
      Str.dedent(`
        deno.json:
          - import: jsr:@sys/std@0.0.333
        package.json:
          - import: npm:react@19.2.5
      `),
    );

    const lines: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));

    try {
      await WorkspacePrep.Deps.sync({ cwd: fs.dir, log: true });
    } finally {
      console.info = info;
    }

    expect(lines.join('\n')).to.include('Workspace import map');
    expect(lines.join('\n')).to.include('2 dependencies written to:');
    expect(lines.join('\n')).to.include('imports.json');
    expect(lines.join('\n')).to.include('package.json');
  });
});

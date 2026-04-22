import { describe, expect, Fs, it } from '../../-test.ts';
import { ViteStartup } from '../../m.vite.startup/mod.ts';

describe('Bootstrap runtime-additions world', () => {
  it('plain consumer startup additions include the startup-critical baseline without freezing the full roster', async () => {
    const root = await fixture({
      prefix: 'vite.bootstrap.runtime-additions.plain-',
      packageJson: {
        dependencies: {
          vite: '8.0.9',
          esbuild: '0.27.4',
        },
      },
      denoJson: {},
    });

    const authority = await ViteStartup.Projection.create({
      cwd: root as never,
      vite: 'npm:vite@8.0.9',
    });

    expectStartupCriticalBaseline(authority.imports, 'npm:vite@8.0.9');
    expect('@rolldown/pluginutils' in authority.imports).to.eql(false);
  });

  it('plugin-react-sensitive additions only appear when that interop fact is present', async () => {
    const plainRoot = await fixture({
      prefix: 'vite.bootstrap.runtime-additions.plain-react-',
      packageJson: {
        dependencies: {
          vite: '8.0.9',
          esbuild: '0.27.4',
        },
      },
      denoJson: {},
    });
    const reactRoot = await fixture({
      prefix: 'vite.bootstrap.runtime-additions.react-',
      packageJson: {
        dependencies: {
          vite: '8.0.9',
          esbuild: '0.27.4',
          '@vitejs/plugin-react': '6.0.1',
        },
      },
      denoJson: {},
    });

    const plain = await ViteStartup.Projection.create({
      cwd: plainRoot as never,
      vite: 'npm:vite@8.0.9',
    });
    const react = await ViteStartup.Projection.create({
      cwd: reactRoot as never,
      vite: 'npm:vite@8.0.9',
    });

    expectStartupCriticalBaseline(plain.imports, 'npm:vite@8.0.9');
    expectStartupCriticalBaseline(react.imports, 'npm:vite@8.0.9');
    expect('@rolldown/pluginutils' in plain.imports).to.eql(false);
    expect(react.imports['@rolldown/pluginutils']).to.match(/^npm:@rolldown\/pluginutils@/);
  });

  it('remaining additions stay explicit instead of mirroring consumer package dependencies', async () => {
    const root = await fixture({
      prefix: 'vite.bootstrap.runtime-additions.explicit-',
      packageJson: {
        dependencies: {
          vite: '8.0.9',
          esbuild: '0.27.4',
          react: '19.2.5',
          'react-dom': '19.2.5',
          lodash: '4.17.21',
        },
      },
      denoJson: {
        imports: {
          '@sys/http': './src/http.ts',
        },
      },
    });

    const authority = await ViteStartup.Projection.create({
      cwd: root as never,
      vite: 'npm:vite@8.0.9',
    });

    expect(authority.imports['@sys/http']).to.eql('./src/http.ts');
    expect('react' in authority.imports).to.eql(false);
    expect('react-dom' in authority.imports).to.eql(false);
    expect('lodash' in authority.imports).to.eql(false);
    expect(authority.imports.vite).to.eql('npm:vite@8.0.9');
  });
});

async function fixture(args: {
  prefix: string;
  packageJson: Record<string, unknown>;
  denoJson: Record<string, unknown>;
}) {
  const tmp = await Fs.makeTempDir({ prefix: args.prefix });
  const root = tmp.absolute;
  await Deno.writeTextFile(`${root}/package.json`, `${JSON.stringify(args.packageJson, null, 2)}\n`);
  await Deno.writeTextFile(`${root}/deno.json`, `${JSON.stringify(args.denoJson, null, 2)}\n`);
  return root;
}

function expectStartupCriticalBaseline(imports: Record<string, string>, vite: string) {
  expect(Object.keys(imports)).to.include.members([...REQUIRED_STARTUP_IMPORT_KEYS]);
  expect(imports.fs).to.eql('node:fs');
  expect(imports.path).to.eql('node:path');
  expect(imports.zlib).to.eql('node:zlib');
  expect(imports.vite).to.eql(vite);
  expect(imports['vite/internal']).to.eql(`${vite}/internal`);
  expect(imports['vite/module-runner']).to.eql(`${vite}/module-runner`);
  expect(imports.lightningcss).to.match(/^npm:lightningcss@/);
  expect(imports.picomatch).to.match(/^npm:picomatch@/);
  expect(imports.postcss).to.match(/^npm:postcss@/);
  expect(imports.rolldown).to.match(/^npm:rolldown@/);
  expect(imports.tinyglobby).to.match(/^npm:tinyglobby@/);
  expect(imports['rolldown/experimental']).to.match(/^npm:rolldown@.+\/experimental$/);
  expect(imports['rolldown/filter']).to.match(/^npm:rolldown@.+\/filter$/);
  expect(imports['rolldown/parseAst']).to.match(/^npm:rolldown@.+\/parseAst$/);
  expect(imports['rolldown/plugins']).to.match(/^npm:rolldown@.+\/plugins$/);
  expect(imports['rolldown/utils']).to.match(/^npm:rolldown@.+\/utils$/);
}

const REQUIRED_STARTUP_IMPORT_KEYS = [
  'fs',
  'lightningcss',
  'path',
  'picomatch',
  'postcss',
  'rolldown',
  'rolldown/experimental',
  'rolldown/filter',
  'rolldown/parseAst',
  'rolldown/plugins',
  'rolldown/utils',
  'tinyglobby',
  'vite',
  'vite/internal',
  'vite/module-runner',
  'zlib',
] as const;

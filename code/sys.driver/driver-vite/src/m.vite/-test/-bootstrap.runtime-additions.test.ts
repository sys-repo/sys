import { describe, expect, Fs, it, Json } from '../../-test.ts';
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

  it('plugin-react interop does not widen the startup additions surface by itself', async () => {
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
    expect('@rolldown/pluginutils' in react.imports).to.eql(false);
    expect(Object.keys(react.imports)).to.eql(Object.keys(plain.imports));
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
  await Fs.write(`${root}/package.json`, `${Json.stringify(args.packageJson, 2)}\n`);
  await Fs.write(`${root}/deno.json`, `${Json.stringify(args.denoJson, 2)}\n`);
  return root;
}

function expectStartupCriticalBaseline(imports: Record<string, string>, vite: string) {
  expect(Object.keys(imports)).to.include.members([...REQUIRED_STARTUP_IMPORT_KEYS]);
  expect(imports.zlib).to.eql('node:zlib');
  expect(imports.vite).to.eql(vite);
  expect(imports['vite/internal']).to.eql(`${vite}/internal`);
  expect(imports['vite/module-runner']).to.eql(`${vite}/module-runner`);
  expect(imports.fs).to.eql(undefined);
  expect(imports.path).to.eql(undefined);
  expect(imports.lightningcss).to.eql(undefined);
  expect(imports.picomatch).to.eql(undefined);
  expect(imports.postcss).to.eql(undefined);
  expect(imports.rolldown).to.eql(undefined);
  expect(imports['rolldown/experimental']).to.eql(undefined);
  expect(imports.tinyglobby).to.eql(undefined);
}

const REQUIRED_STARTUP_IMPORT_KEYS = [
  'vite',
  'vite/internal',
  'vite/module-runner',
  'zlib',
] as const;

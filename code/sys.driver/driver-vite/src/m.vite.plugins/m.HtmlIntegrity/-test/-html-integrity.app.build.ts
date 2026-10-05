import { build } from 'vite';
import { describe, expect, Fs, Is, it, type t, Try } from '../../../-test.ts';
import { ViteConfig } from '../../../m.vite.config/mod.ts';
import { VitePlugins } from '../../mod.ts';
import type { BuildFixture } from './t.fixture.ts';
import {
  createFixture,
  expectBuildRefusal,
  expectDevelopment,
  expectWritten,
  readBuiltHtml,
} from './u.fixture.ts';

type AppComposition = Pick<t.ViteConfig.App.Options, 'plugins' | 'vitePlugins'>;
type DuplicateCase = {
  readonly name: string;
  readonly create: () => AppComposition;
};

// Each constructor makes fresh instances; repeated identity is intentional in exactly one case.
const DUPLICATES: readonly DuplicateCase[] = [
  {
    name: 'boolean + factory',
    create: () => ({
      plugins: { htmlIntegrity: true },
      vitePlugins: [VitePlugins.HtmlIntegrity.plugin()],
    }),
  },
  {
    name: 'distinct',
    create: () => ({
      vitePlugins: [VitePlugins.HtmlIntegrity.plugin(), VitePlugins.HtmlIntegrity.plugin()],
    }),
  },
  {
    name: 'repeated',
    create() {
      const plugin = VitePlugins.HtmlIntegrity.plugin();
      return { vitePlugins: [plugin, plugin] };
    },
  },
  {
    name: 'nested/promise',
    create: () => ({
      vitePlugins: [
        [false, Promise.resolve(VitePlugins.HtmlIntegrity.plugin())],
        Promise.resolve([null, [VitePlugins.HtmlIntegrity.plugin()]]),
      ],
    }),
  },
];

describe('ViteConfig.app → HTML integrity composition', () => {
  for (const { name, create } of DUPLICATES) {
    it(`refuses duplicate integrity → ${name}`, async () => {
      await using fixture = await createFixture();
      const config = await appConfig(fixture, create());
      await expectBuildRefusal(
        config,
        '[sys:html-integrity] duplicate sys:html-integrity plugins; choose plugins.htmlIntegrity or one explicit factory instance',
      );
    });
  }

  for (const htmlIntegrity of [undefined, false, true]) {
    it(`app opt-in ${htmlIntegrity} → written bytes and unchanged development`, async () => {
      await using fixture = await createFixture();
      const { root } = fixture;
      const config = await appConfig(fixture, {
        plugins: { htmlIntegrity },
        vitePlugins: [callerMutation()],
      });

      await build(config);
      if (htmlIntegrity) await expectWritten(root, './');
      else expect(await readBuiltHtml(root)).not.to.include('integrity=');

      await expectDevelopment(config);
    });
  }

  it('later disk writer → successful build is not SRI consistency', async () => {
    await using fixture = await createFixture();
    const { root, config } = fixture;
    await build(config);
    await expectWritten(root, './');

    await build({ ...config, plugins: [...config.plugins ?? [], laterWriter(root)] });
    const { result } = await Try.run(() => expectWritten(root, './'));
    if (result.ok) throw new Error('expected stale integrity');
    expect(result.error.message).to.include('integrity="sha256-');
  });
});

/** Use the app's plugin assembly with the isolated project's existing build inputs. */
async function appConfig(fixture: BuildFixture, composition: AppComposition) {
  const app = await ViteConfig.app({
    paths: ViteConfig.paths({ cwd: fixture.root }),
    workspace: false,
    plugins: {
      deno: false,
      react: false,
      wasm: false,
      optimizeImports: false,
      ...composition.plugins,
    },
    vitePlugins: composition.vitePlugins,
  });
  return { ...fixture.config, plugins: app.plugins };
}

/** Caller hooks must run before hashing, even when both hooks are post-ordered. */
function callerMutation(): t.VitePlugin {
  return {
    name: 'caller:post-mutation',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler: (_options, bundle) => Object.values(bundle).forEach(mutateAsset),
    },
  };
}

function mutateAsset(output: t.Rollup.OutputChunk | t.Rollup.OutputAsset): void {
  if (output.type === 'chunk') {
    output.code += '\n;globalThis.afterCaller = true;';
    return;
  }
  if (output.fileName.endsWith('.css') && Is.str(output.source)) {
    output.source += '\nbody { margin: 3px; }';
  }
}

/** Deliberately outside supported composition: change written JS after integrity finalization. */
function laterWriter(root: string): t.VitePlugin {
  return {
    name: 'unsupported:later-writer',
    async writeBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        const path = Fs.join(root, 'dist', output.fileName);
        await Fs.write(path, `${output.code}\n;console.info('later');`, { throw: true });
      }
    },
  };
}

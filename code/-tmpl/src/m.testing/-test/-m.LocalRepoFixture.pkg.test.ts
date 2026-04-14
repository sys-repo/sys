import { describe, expect, Fs, it } from '../../-test.ts';
import { Fmt } from '../../-tests/u.ts';
import { TmplTesting } from '../mod.ts';
import { runRepoCi, writePkg, writeText } from './u.fixture.ts';

describe('m.testing/LocalRepoFixture/pkg', () => {
  it('create → add pkg → rewrite → repo ci passes', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
    const fixture = await TmplTesting.LocalRepoFixture.create();
    const pkgDir = await writePkg(fixture.root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root: fixture.root });

    const denoJson = await Fs.readJson<{ readonly tasks?: Record<string, string> }>(Fs.join(pkgDir, 'deno.json'));
    expect(denoJson.data?.tasks?.build).to.eql(
      'deno run -A ./-scripts/task.vite.ts --cmd=build --in=./src/-test/index.html',
    );
    expect(denoJson.data?.tasks?.deploy).to.eql(undefined);

    const ci = await runRepoCi(fixture.root);
    if (!ci.success) {
      throw new Error(
        `Localized repo fixture pkg ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });

  it('create → add foo + bar → import @tmp/foo from @tmp/bar → repo ci passes', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
    const fixture = await TmplTesting.LocalRepoFixture.create({ silent: true });
    const fooDir = await writePkg(fixture.root, 'code/packages/foo', '@tmp/foo');
    const barDir = await writePkg(fixture.root, 'code/packages/bar', '@tmp/bar');

    await writeText(
      Fs.join(fooDir, 'src', 'mod.ts'),
      `export type Foo = {
  count: number;
  inc(): number;
};

export const MyFoo: Foo = {
  count: 123,
  inc: () => MyFoo.count + 1,
};
`,
    );

    await writeText(
      Fs.join(barDir, 'src', 'mod.ts'),
      `import { MyFoo, type Foo } from '@tmp/foo';

export const MyBar: Foo = {
  count: MyFoo.count + 1,
  inc: () => MyFoo.count + 2,
};
`,
    );

    await writeText(
      Fs.join(barDir, 'src', '-test', '-.test.ts'),
      `import { describe, expect, it } from '../-test.ts';
import { MyBar } from '../mod.ts';
import { MyFoo } from '@tmp/foo';

describe('module: @tmp/bar', () => {
  it('imports @tmp/foo across workspace packages', () => {
    expect(MyFoo.inc()).to.eql(124);
    expect(MyBar.count).to.eql(124);
    expect(MyBar.inc()).to.eql(125);
  });
});
`,
    );

    await TmplTesting.LocalRepoAuthorities.rewrite({ root: fixture.root });

    const ci = await runRepoCi(fixture.root);
    if (!ci.success) {
      throw new Error(
        `Localized repo fixture foo/bar ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });
});

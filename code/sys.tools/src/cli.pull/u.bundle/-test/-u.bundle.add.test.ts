import { describe, expect, expectError, Fs, it, Str, type t } from '../../../-test.ts';
import { addDistBundle, type PullAddInput } from '../../u.add.ts';
import { PullFs } from '../../u.yaml/mod.ts';
import { pullBundle } from '../u.bundle.ts';

const CONFIG = './-config/@sys.tools.pull/components.yaml';
const MANIFEST = 'https://example.com/components/dist.json';
const PIN = { scheme: 'sys.dist/v2', digest: `sha256-${'a'.repeat(64)}` } as const;
const INITIAL = Str.dedent(`
  # Keep this config unchanged on refusal.
  dir: .
`).trimStart();

describe('cli.pull/u.bundle → shared Dist addition', () => {
  it('interactive and direct addition → persist the same canonical bundle without materializing', async () => {
    await withConfig(async (input, path) => {
      const values = { ...input, manifest: ` ${MANIFEST}#ignored ` };
      await addDistBundle(values);
      const expected = (await Fs.readText(path)).data;
      await Fs.write(path, INITIAL, { throw: true });

      expect(await interactiveAdd(values)).to.eql({ kind: 'back' });

      expect((await Fs.readText(path)).data).to.eql(expected);
      expect(await Fs.exists(Fs.join(input.cwd, '.dist-store'))).to.eql(false);
      expect(await Fs.exists(Fs.join(input.cwd, 'view'))).to.eql(false);
    });
  });

  for (const projection of [true, false]) {
    it(`duplicate with projection=${projection} → both routes preserve exact YAML bytes`, async () => {
      await withConfig(async (input, path) => {
        const values = projection ? input : { ...input, project: undefined, mode: undefined };
        await addDistBundle(values);
        const before = `# Preserve this comment on a no-op.\n${(await Fs.readText(path)).data}`;
        await Fs.write(path, before, { throw: true });

        expect((await addDistBundle(values)).kind).to.eql('exists');
        expect((await Fs.readText(path)).data).to.eql(before);
        expect(await interactiveAdd(values)).to.eql({ kind: 'back' });
        expect((await Fs.readText(path)).data).to.eql(before);

        const equivalent = {
          ...values,
          store: '.dist-store/',
          project: projection ? 'view/components/' : undefined,
        };
        expect((await addDistBundle(equivalent)).kind).to.eql('exists');
        expect(await interactiveAdd(equivalent)).to.eql({ kind: 'back' });
        expect((await Fs.readText(path)).data).to.eql(before);
      });
    });
  }

  for (
    const scenario of [
      {
        name: 'pin',
        input: { pin: { ...PIN, digest: 'invalid' } },
        error: 'Pull add: a canonical independently supplied content pin is required.',
      },
      {
        name: 'schema',
        input: { project: 'view\\invalid' },
        error: 'Pull add: generated invalid config:',
      },
      {
        name: 'mode',
        input: { mode: 'merge' },
        error: 'Pull add: --project requires --mode create|replace.',
      },
    ]
  ) {
    it(`invalid ${scenario.name} input → both routes refuse without writing`, async () => {
      await withConfig(async (input, path) => {
        const values = { ...input, ...scenario.input };
        for (const add of [addDistBundle, interactiveAdd]) {
          await expectError(() => add(values), scenario.error);
          expect((await Fs.readText(path)).data).to.eql(INITIAL);
          expect(await Fs.exists(Fs.join(input.cwd, '.dist-store'))).to.eql(false);
          expect(await Fs.exists(Fs.join(input.cwd, 'view'))).to.eql(false);
        }
      });
    });
  }

  it('config changes during prompts → isolate against the current document, not the menu snapshot', async () => {
    await withConfig(async (input, path) => {
      let changed: string | undefined;
      await expectError(
        () =>
          interactiveAdd(input, async () => {
            await addDistBundle({ ...input, pin: { ...PIN, digest: `sha256-${'b'.repeat(64)}` } });
            changed = (await Fs.readText(path)).data;
          }),
        'Pull add: projection target already used:',
      );
      expect(changed).to.be.a('string');
      expect((await Fs.readText(path)).data).to.eql(changed);
    });
  });

  it('config becomes invalid during prompts → refuse without overwriting its bytes', async () => {
    await withConfig(async (input, path) => {
      const changed = Str.dedent(`
        dir: .
        unknown: true
      `).trimStart();
      await expectError(
        () =>
          interactiveAdd(input, async () => {
            await Fs.write(path, changed, { throw: true });
          }),
        'Pull add: invalid config:',
      );
      expect((await Fs.readText(path)).data).to.eql(changed);
    });
  });
});

/** Only prompts are substituted; the real add operation and filesystem remain under test. */
async function interactiveAdd(input: PullAddInput, beforeSubmit?: () => Promise<void>) {
  const path = Fs.resolve(input.cwd, input.config);
  const loaded = await PullFs.loadLocation(path);
  if (!loaded.ok) throw new Error('Expected valid menu configuration.');
  const texts = [input.manifest, input.pin.digest, input.store, input.project ?? ''];
  const selections = ['bundle:add-dist', ...(input.project ? [input.mode] : []), 'back'];
  const prompts: NonNullable<Parameters<typeof pullBundle>[3]> = {
    Text: {
      async prompt() {
        const value = texts.shift();
        if (value === undefined) throw new Error('Unexpected text prompt.');
        if (texts.length === 0) await beforeSubmit?.();
        // Deliberately bypass terminal validators: persistence must independently admit inputs.
        return value;
      },
    },
    Select: {
      prompt() {
        const value = selections.shift();
        if (value === undefined) throw new Error('Unexpected selection prompt.');
        return Promise.resolve(value);
      },
    },
  };
  const result = await pullBundle(input.cwd, path, loaded.location, prompts);
  if (result.kind === 'back') {
    expect(texts).to.eql([]);
    expect(selections).to.eql([]);
  }
  return result;
}

async function withConfig(fn: (input: PullAddInput, path: t.StringPath) => Promise<void>) {
  const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.add.parity.' });
  const input: PullAddInput = {
    cwd: root.absolute,
    config: CONFIG,
    manifest: MANIFEST,
    pin: PIN,
    store: './.dist-store',
    project: './view/components',
    mode: 'replace',
  };
  const path = Fs.resolve(input.cwd, input.config);
  try {
    await Fs.write(path, INITIAL, { throw: true });
    await fn(input, path);
  } finally {
    await Fs.remove(root.absolute);
  }
}

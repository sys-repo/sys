import {
  Cli,
  describe,
  Err,
  expect,
  expectError,
  Fs,
  Is,
  it,
  Obj,
  Str,
  type t,
  Testing,
  Time,
} from '../../-test.ts';
import { runWith } from '../m.run.ts';
import { runInteractiveWith } from '../u/u.interactive.ts';
import { Fmt } from '../u.fmt/u.fmt.ts';
import {
  apply,
  collect,
  fetchFail,
  infoJsr,
  infoNpm,
  registry as createRegistry,
  session,
  standdownTime as T,
  upgrade,
  versionsJsr,
  versionsNpm,
  writeDepsYaml,
} from '../../m.upgrade/-test/u.fixture.ts';

describe('Workspace.Cli standdown orchestration', () => {
  it('applies a selector-free same-name mixed-registry batch using one CLI clock', async () => {
    await withClock(async (clock) => {
      const fs = await workspace(`
        deno.json:
          - name: fromNpm
            import: npm:@sample/pkg@1.0.0
          - name: fromJsr
            import: jsr:@sample/pkg@1.0.0
      `);
      const registry = createRegistry({
        versions: {
          npm: {
            '@sample/pkg': versionsNpm('@sample/pkg', '3.0.0', {
              '1.0.0': {},
              '2.0.0': { publishedAt: T.older },
              '3.0.0': { publishedAt: T.tooNew },
            }),
          },
          jsr: {
            '@sample/pkg': versionsJsr('@sample/pkg', '3.0.0', {
              '1.0.0': {},
              '2.0.0': { createdAt: T.older },
              '3.0.0': { createdAt: T.tooNew },
            }),
          },
        },
        info: {
          npm: {
            '@sample/pkg@2.0.0': infoNpm('@sample/pkg', '2.0.0'),
            '@sample/pkg@3.0.0': infoNpm('@sample/pkg', '3.0.0'),
          },
          jsr: {
            '@sample/pkg@2.0.0': infoJsr('@sample/pkg', '2.0.0'),
            '@sample/pkg@3.0.0': infoJsr('@sample/pkg', '3.0.0'),
          },
        },
      });
      const calls = { npm: 0, jsr: 0 };
      const counted = {
        npm: {
          ...registry.npm,
          versions(name: string) {
            calls.npm++;
            return registry.npm.versions(name);
          },
        },
        jsr: {
          ...registry.jsr,
          versions(name: string) {
            calls.jsr++;
            return registry.jsr.versions(name);
          },
        },
      };
      let preview: t.WorkspaceUpgrade.Result | undefined;
      const result = await runWith({
        upgrade: {
          ...library(counted),
          async upgrade(input, options) {
            preview = await upgrade(counted, input, options);
            clock.now += 10 * T.day;
            expect(Time.now.timestamp).to.eql(clock.now);
            return preview;
          },
        },
      }, { cwd: fs.dir, argv: ['upgrade', '--non-interactive', '--policy', 'latest'] });
      expect(result.kind).to.eql('apply');
      if (result.kind !== 'apply') throw Err.std('Expected apply');
      expect(result.options.evaluatedAt).to.eql(T.now);
      expect(result.applied.options.evaluatedAt).to.eql(T.now);
      const pins = result.applied.entries.map((entry) => entry.module.version);
      expect(pins).to.eql(['2.0.0', '2.0.0']);
      expect(result.upgrade.collect.candidates.map((entry) => entry.versions[0].eligibility.kind))
        .to.eql(['standdown', 'standdown']);
      expect(calls).to.eql({ npm: 2, jsr: 2 }); // Separate planning and apply sessions.
      expect(Fmt.summaryCounts(preview!).standdown).to.eql(2);
      expect(preview?.totals.planned).to.eql(2);
      expect(Cli.stripAnsi(Fmt.plan(preview!))).to.include('Dependency standdown');
      const json = await Fs.readJson<{ imports: Record<string, string> }>(fs.join('deno.json'));
      expect(json.data?.imports).to.eql({
        fromNpm: 'npm:@sample/pkg@2.0.0',
        fromJsr: 'jsr:@sample/pkg@2.0.0',
      });
      expect((await Fs.readText(fs.join('deps.yaml'))).data).to.not.include('@3.0.0');
      // Independent calls resolve their own omitted clock; the CLI does not freeze the library.
      const later = await upgrade(counted, { cwd: fs.dir, deps: fs.join('deps.yaml') }, {
        policy: { mode: 'latest' },
        minimumDependencyAge: 2 * T.day,
      });
      expect(later.options.evaluatedAt).to.eql(clock.now);
      expect(later.collect.candidates.map((entry) => entry.eligible[0])).to.eql(['3.0.0', '3.0.0']);
    });
  });

  it('keeps recovered unincluded metadata excluded and evaluates changed facts during apply', async () => {
    await withClock(async () => {
      const fs = await workspace(`
        deno.json:
          - import: npm:a@1.0.0
          - import: npm:b@1.0.0
      `);
      const counts = new Map<string, number>();
      const base = createRegistry({
        versions: { jsr: {}, npm: {} },
        info: { jsr: {}, npm: { 'a@2.0.0': infoNpm('a', '2.0.0') } },
      });
      const registry = {
        ...base,
        npm: {
          ...base.npm,
          versions(name: string) {
            const pass = (counts.get(name) ?? 0) + 1;
            counts.set(name, pass);
            if (name === 'b' && pass === 1) {
              return Promise.resolve(fetchFail('https://registry.npmjs.org/b'));
            }
            return Promise.resolve(versionsNpm(name, '2.0.0', {
              '1.0.0': {},
              '2.0.0': { publishedAt: name === 'a' && pass > 1 ? T.tooNew : T.older },
            }));
          },
        },
      };
      let preview: t.WorkspaceUpgrade.Result | undefined;
      const result = await runWith({
        upgrade: {
          ...library(registry),
          async upgrade(input, options) {
            preview = await upgrade(registry, input, options);
            return preview;
          },
        },
      }, {
        cwd: fs.dir,
        argv: ['upgrade', '--non-interactive', '--policy', 'latest', '--include', 'a'],
      });
      expect(result.kind).to.eql('apply');
      if (result.kind !== 'apply') throw Err.std('Expected apply');
      expect(preview?.totals.planned).to.eql(1);
      expect(preview?.collect.uncollected[0].entry.module.name).to.eql('b');
      expect(result.selection.exclude).to.eql(['b']);
      const pins = result.applied.entries.map((entry) => entry.module.version);
      expect(pins).to.eql(['1.0.0', '1.0.0']);
      expect(result.upgrade.collect.candidates[0].versions[0].eligibility.kind).to.eql('standdown');
      expect(result.upgrade.policy.decisions[1].ok).to.eql(false);
      expect([...counts.values()]).to.eql([2, 2]);
    });
  });

  it('rejects name/alias and duplicate-name checkbox conflicts before callbacks or writes', async () => {
    const manifests = [
      Str.dedent(`
        deno.json:
          - name: b
            import: npm:a@1.0.0
          - name: c
            import: npm:b@1.0.0
      `),
      Str.dedent(`
        deno.json:
          - name: first
            import: npm:@sample/pkg@1.0.0
          - name: second
            import: jsr:@sample/pkg@1.0.0
      `),
    ];
    for (const yaml of manifests) {
      const fs = await workspace(yaml);
      let calls = 0;
      const unexpected = () => {
        calls++;
        throw Err.std('Unexpected callback');
      };
      const before = (await Fs.readText(fs.join('deps.yaml'))).data;
      const interactiveError = await expectError(() =>
        runInteractiveWith(
          { createSession: unexpected, promptCheckbox: unexpected },
          { cwd: fs.dir, deps: fs.join('deps.yaml') },
          options(fs),
        )
      );
      expect(interactiveError.message).to.include('Ambiguous workspace CLI selector');
      expect(interactiveError.message).to.include('alias:');
      const token = yaml.includes('npm:a@') ? 'a' : 'first';
      const error = await expectError(() =>
        runWith({
          upgrade: { collect: unexpected, upgrade: unexpected, apply: unexpected },
        }, { cwd: fs.dir, argv: ['upgrade', '--non-interactive', '--include', token] })
      );
      expect(error.message).to.include('Ambiguous workspace CLI selector');
      expect(calls).to.eql(0);
      expect((await Fs.readText(fs.join('deps.yaml'))).data).to.eql(before);
      expect((await Fs.readJson(fs.join('deno.json'))).data).to.eql({ name: 'standdown-cli' });
    }
  });

  it('preserves representable multi-match flags and shared-alias checkbox semantics', async () => {
    await withClock(async () => {
      const registry = createRegistry({
        versions: {
          jsr: {},
          npm: {
            a: versionsNpm('a', '2.0.0', { '2.0.0': { publishedAt: T.older } }),
            b: versionsNpm('b', '2.0.0', { '2.0.0': { publishedAt: T.older } }),
          },
        },
        info: {
          jsr: {},
          npm: { 'a@2.0.0': infoNpm('a', '2.0.0'), 'b@2.0.0': infoNpm('b', '2.0.0') },
        },
      });
      const fs = await workspace(`
        deno.json:
          - name: b
            import: npm:a@1.0.0
          - name: c
            import: npm:b@1.0.0
      `);
      const result = await runWith({ upgrade: library(registry) }, {
        cwd: fs.dir,
        argv: ['upgrade', '--non-interactive', '--policy', 'latest', '--include', 'b'],
      });
      expect(result.kind).to.eql('apply');
      if (result.kind !== 'apply') throw Err.std('Expected apply');
      expect(result.selection.exclude).to.eql([]);
      const pins = result.applied.entries.map((entry) => entry.module.version);
      expect(pins).to.eql(['2.0.0', '2.0.0']);
      const excluded = await runWith({ upgrade: library(registry) }, {
        cwd: fs.dir,
        argv: ['upgrade', '--non-interactive', '--dry-run', '--include', 'a', '--exclude', 'b'],
      });
      expect(excluded.kind).to.eql('plan'); // Explicit exclusion already removes the cross-match.

      const shared = await workspace(`
        deno.json:
          - name: shared
            import: npm:a@1.0.0
          - name: shared
            import: npm:b@1.0.0
      `);
      const selected = await runInteractiveWith(
        {
          createSession: () => session(registry),
          promptCheckbox: () => Promise.resolve(['a', 'b']),
        },
        { cwd: shared.dir, deps: shared.join('deps.yaml') },
        options(shared, { dryRun: true }),
      );
      expect(selected.selection.include).to.eql(['a', 'b']);
      expect(selected.upgrade.totals.planned).to.eql(2);
      // Dry-run only: duplicate emitted alias keys do not gain new projection support.
      const byAlias = await runWith({ upgrade: library(registry) }, {
        cwd: shared.dir,
        argv: [
          'upgrade',
          '--non-interactive',
          '--dry-run',
          '--policy',
          'latest',
          '--include',
          'shared',
        ],
      });
      expect(byAlias.kind).to.eql('plan');
      if (byAlias.kind === 'plan') expect(byAlias.upgrade.totals.planned).to.eql(2);
    });
  });

  it('accepts one canonical entry merged across Deno and package targets', async () => {
    const fs = await workspace(`
      deno.json:
        - import: npm:a@1.0.0
      package.json:
        - import: npm:a@1.0.0
    `);
    const registry = createRegistry({
      versions: {
        jsr: {},
        npm: { a: versionsNpm('a', '2.0.0', { '2.0.0': { publishedAt: T.older } }) },
      },
      info: { jsr: {}, npm: { 'a@2.0.0': infoNpm('a', '2.0.0') } },
    });
    const result = await runInteractiveWith(
      {
        createSession: () => session(registry),
        promptCheckbox(input) {
          expect(input.options.length).to.eql(1);
          return Promise.resolve(['a']);
        },
      },
      { cwd: fs.dir, deps: fs.join('deps.yaml') },
      options(fs),
    );
    expect(result.applied?.entries.length).to.eql(1);
    expect(result.applied?.entries[0].target).to.eql(['deno.json', 'package.json']);
    const pkg = await Fs.readJson<{ dependencies: unknown }>(fs.join('package.json'));
    expect(pkg.data?.dependencies).to.eql({ a: '2.0.0' });
  });

  it('holds both registries through interactive override, disabled responses, and clock advancement', async () => {
    await withClock(async (clock) => {
      const fs = await workspace(`
        deno.json:
          - import: npm:a@1.0.0
          - import: jsr:@sample/a@1.0.0
          - import: npm:held@1.0.0
          - import: jsr:@sample/held@1.0.0
          - import: npm:empty@1.0.0
      `);
      const registry = createRegistry({
        versions: {
          npm: {
            a: versionsNpm('a', '3.0.0', {
              '1.0.0': {},
              '2.0.0': { publishedAt: T.older },
              '3.0.0': { publishedAt: T.tooNew },
            }),
            held: versionsNpm('held', '2.0.0', {
              '1.0.0': {},
              '2.0.0': { publishedAt: T.tooNew },
            }),
            empty: versionsNpm('empty', '1.0.0'),
          },
          jsr: {
            '@sample/a': versionsJsr('@sample/a', '3.0.0', {
              '1.0.0': {},
              '2.0.0': { createdAt: T.older },
              '3.0.0': { createdAt: T.tooNew },
            }),
            '@sample/held': versionsJsr('@sample/held', '2.0.0', { '1.0.0': {}, '2.0.0': {} }),
          },
        },
        info: {
          npm: { 'a@2.0.0': infoNpm('a', '2.0.0') },
          jsr: { '@sample/a@2.0.0': infoJsr('@sample/a', '2.0.0') },
        },
      });
      let versions = 0;
      const counted = {
        npm: {
          ...registry.npm,
          versions(name: string) {
            versions++;
            return registry.npm.versions(name);
          },
        },
        jsr: {
          ...registry.jsr,
          versions(name: string) {
            versions++;
            return registry.jsr.versions(name);
          },
        },
      };
      const result = await runInteractiveWith(
        {
          createSession: () => session(counted),
          promptCheckbox(input) {
            const rows = input.options.map((row) => {
              if (!Obj.isRecord(row) || !Is.str(row.name) || !Is.str(row.value)) {
                throw Err.std('Expected a named checkbox option');
              }
              return { name: row.name, value: row.value, disabled: row.disabled === true };
            });
            const disabled = rows.filter((row) => row.disabled).map((row) => row.value);
            expect(disabled).to.eql(['held', '@sample/held', 'empty']);
            expect(Cli.stripAnsi(rows[0].name)).to.include('age eligible in 36h');
            expect(Cli.stripAnsi(rows[3].name)).to.include('publish timestamp unavailable');
            expect(Cli.stripAnsi(rows[4].name)).to.include('pin retained; no visible candidate');
            clock.now += 10 * T.day;
            expect(Time.now.timestamp).to.eql(clock.now);
            return Promise.resolve(['a', '@sample/a', 'held', '@sample/held', 'empty']);
          },
        },
        { cwd: fs.dir, deps: fs.join('deps.yaml') },
        options(fs, { policy: 'minor', include: ['held', '@sample/held'] }),
      );
      expect(result.selection.include).to.eql(['@sample/a', 'a']);
      const pins = result.applied?.entries.map((entry) => entry.module.version);
      expect(pins).to.eql(['2.0.0', '2.0.0', '1.0.0', '1.0.0', '1.0.0']);
      expect(result.upgrade.options.policy.mode).to.eql('latest');
      expect(result.upgrade.options.evaluatedAt).to.eql(T.now);
      expect(versions).to.eql(5);
      const counts = Fmt.summaryCounts(result.upgrade);
      expect(counts.current).to.eql(0);
      expect(counts.pinRetained).to.eql(1);
      expect(counts.standdown).to.eql(4);
      const text = Cli.stripAnsi(Fmt.plan(result.upgrade));
      expect(text).to.include('Pin retained; no visible candidate');
      expect(text).to.include('36h');
    });
  });

  it('renders native one-millisecond holds without premature zero countdowns', async () => {
    const fs = await workspace(`
      deno.json:
        - import: npm:a@1.0.0
        - import: jsr:@sample/a@1.0.0
    `);
    const publication = '2026-06-26T00:00:00.001Z';
    const registry = createRegistry({
      versions: {
        npm: { a: versionsNpm('a', '2.0.0', { '2.0.0': { publishedAt: publication } }) },
        jsr: {
          '@sample/a': versionsJsr('@sample/a', '2.0.0', { '2.0.0': { createdAt: publication } }),
        },
      },
    });
    const result = await upgrade(registry, { cwd: fs.dir, deps: fs.join('deps.yaml') }, {
      policy: { mode: 'latest' },
      minimumDependencyAge: 2 * T.day,
      evaluatedAt: T.now,
    });
    const rows = Fmt.selectionOptions(result, options(fs));
    expect(rows.length).to.eql(2);
    for (const row of rows) {
      expect(row.disabled).to.eql(true);
      expect(Cli.stripAnsi(row.name)).to.include('age eligible in <1s');
    }
    expect(Cli.stripAnsi(Fmt.plan(result))).to.include('<1s');
    expect(result.totals.planned).to.eql(0);
  });

  it('rounds countdowns upward without changing elapsed-age formatting', () => {
    const cases = [
      [1, '<1s'],
      [999, '<1s'],
      [1000, '1s'],
      [1001, '2s'],
      [59999, '60s'],
      [60000, '1m'],
      [60001, '2m'],
      [3600000, '1h'],
      [3600001, '2h'],
      [2 * T.day, '2d'],
      [2 * T.day + 1, '3d'],
    ] as const;
    for (const [remaining, text] of cases) expect(Fmt.countdown(remaining)).to.eql(text);
    expect(Fmt.countdown(0)).to.eql('now');
    expect(Fmt.duration(1)).to.eql('0s');
  });
});

async function workspace(yaml: string) {
  const fs = await Testing.dir('WorkspaceCli.standdown');
  await writeDepsYaml(fs, yaml);
  await Fs.writeJson(fs.join('deno.json'), { name: 'standdown-cli' });
  return fs;
}

function options(
  fs: { join(path: string): string },
  overrides: Partial<t.WorkspaceCli.ResolvedOptions> = {},
): t.WorkspaceCli.ResolvedOptions {
  return {
    deps: fs.join('deps.yaml'),
    mode: 'interactive',
    policy: 'latest',
    prerelease: false,
    minimumDependencyAge: 2 * T.day,
    evaluatedAt: T.now,
    include: [],
    exclude: [],
    dryRun: false,
    ...overrides,
  };
}

function library(registry: Parameters<typeof session>[0]): t.WorkspaceUpgrade.Lib {
  return {
    collect: (input, options) => collect(registry, input, options),
    upgrade: (input, options) => upgrade(registry, input, options),
    apply: (input, options) => apply(registry, input, options),
  };
}

/** Control Date construction (Time.now's actual clock), retaining real timers and restoration. */
async function withClock(run: (clock: { now: number }) => Promise<void>) {
  const original = globalThis.Date;
  const clock = { now: T.now };
  globalThis.Date = new Proxy(original, {
    construct: (target, args) => Reflect.construct(target, args.length === 0 ? [clock.now] : args),
    get: (target, key, receiver) =>
      key === 'now' ? () => clock.now : Reflect.get(target, key, receiver),
  });
  try {
    await run(clock);
  } finally {
    globalThis.Date = original;
  }
}

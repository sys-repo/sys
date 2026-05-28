import { c, Cli, describe, Esm, expect, it, type t } from '../../-test.ts';
import { WorkspaceHelp } from '../../m.help/mod.ts';
import { Fmt } from '../u.fmt/u.fmt.ts';
import { FmtHelp } from '../u.fmt/u.fmt.help.ts';

describe('Workspace.Cli.Fmt', () => {
  it('renders DSL root help and skill projections', async () => {
    const text = Cli.stripAnsi(await FmtHelp.dslOutput());
    const guidance = await WorkspaceHelp.Dsl.load();

    expect(text).to.contain('@sys/workspace dsl');
    expect(text).to.contain('Usage');
    expect(text).to.contain('Options');
    expect(text).to.contain('Formats');
    expectSectionLabels(text, guidance.sections.map(({ label }) => label));
    guidance.chapters.forEach((chapter) => expect(text).to.contain(chapterCommand(chapter)));

    const skill = await FmtHelp.dslOutput({ format: 'skill' });
    expect(skill).to.eql(Cli.stripAnsi(skill));
    expect(skill).to.contain('name: "sys-workspace-dsl"');
    expect(skill).to.contain(`${chapterCommand(guidance.chapters[0]!)} --format skill`);
  });

  it('renders the delta DSL chapter without snapshotting prose', async () => {
    const path = ['delta'] as const;
    const text = Cli.stripAnsi(await FmtHelp.dslOutput({ path }));
    const chapter = await WorkspaceHelp.Dsl.load(path);
    const skill = await FmtHelp.dslOutput({ path, format: 'skill' });

    expect(text).to.contain('@sys/workspace dsl delta');
    expectSectionLabels(text, chapter.sections.map(({ label }) => label));
    expect(text).to.not.contain(chapterCommand(chapter));
    expect(skill).to.eql(Cli.stripAnsi(skill));
    expect(skill).to.contain('name: "sys-workspace-dsl-delta"');
  });

  it('keeps root, upgrade, and DSL help within 80 visible columns', async () => {
    expectMaxVisibleWidth(FmtHelp.output(), 80);
    expectMaxVisibleWidth(FmtHelp.upgradeOutput(), 80);
    expectMaxVisibleWidth(await FmtHelp.dslOutput(), 80);
    expectMaxVisibleWidth(await FmtHelp.dslOutput({ format: 'skill' }), 80);
    expectMaxVisibleWidth(await FmtHelp.dslOutput({ path: ['delta'] }), 80);
    expectMaxVisibleWidth(await FmtHelp.dslOutput({ path: ['delta'], format: 'skill' }), 80);
  });

  it('omits the duplicate candidates table from the interactive plan output', () => {
    const plan = Fmt.plan(upgrade());
    const text = Cli.stripAnsi(plan);

    expect(text).to.include('Policy');
    expect(text).to.include('Blocked');
    expect(text).to.include('Already latest');
    expect(text).to.not.include('Dependency   Current');
  });

  it('shows override policy count when package overrides exist', () => {
    const plan = Fmt.plan(upgradeWithOverrides());
    const text = Cli.stripAnsi(plan);

    expect(text).to.include('Overrides');
    expect(Fmt.overrideCount(upgradeWithOverrides())).to.eql(2);
  });

  it('omits override policy count when package overrides do not exist', () => {
    const plan = Fmt.plan(upgrade());
    const text = Cli.stripAnsi(plan);

    expect(text).to.not.include('Overrides');
  });

  it('marks direct override-parent candidates in interactive selection rows', () => {
    const options = Fmt.selectionOptions(upgradeWithOverrides(), {
      include: [],
      exclude: [],
      dryRun: false,
      deps: 'deps.yaml',
      mode: 'interactive',
      policy: 'minor',
      prerelease: false,
    });
    const labels = new Map(options.map((option) => [option.value, Cli.stripAnsi(option.name)]));

    expect(labels.get('monaco-editor')).to.include('override parent');
    expect(labels.get('@automerge/automerge-repo')).to.include('override parent');
    expect(labels.get('dompurify')).to.not.include('override parent');
  });

  it('shows an actionable note when the full interactive upgrade set cannot be ordered', () => {
    const plan = Fmt.plan(topologyBlockedUpgrade());
    const text = Cli.stripAnsi(plan);

    expect(text).to.include(
      'The full upgrade set cannot be ordered together. Pick a smaller set to continue.',
    );
    expect(text).to.not.include('Topology');
  });

  it('shows selected versions for allowed rows and latest versions for blocked rows', () => {
    const result = upgrade();
    const options = Fmt.selectionOptions(result, {
      include: [],
      exclude: [],
      dryRun: false,
      deps: 'deps.yaml',
      mode: 'interactive',
      policy: 'minor',
      prerelease: false,
    });
    const labels = options.map((option) => option.name);
    const plain = labels.map((label) => Cli.stripAnsi(label));
    const arrows = plain.map((label) => label.indexOf('→'));

    expect(labels.length).to.eql(2);
    expect(arrows[0]).to.be.greaterThan(0);
    expect(arrows.every((index) => index === arrows[0])).to.eql(true);

    expect(labels[0]).to.include(c.green('1.2.0'));
    expect(plain[0]).to.include('newer blocked by policy - 2.0.0');
    expect(labels[1]).to.include(c.yellow('19.0.0'));
    expect(plain[1]).to.include('blocked by policy');
  });

  it('keeps common scoped npm package names visible before truncating interactive rows', () => {
    const restore = stubScreenWidth(80);
    try {
      const options = Fmt.selectionOptions(upgradeWithLongScopedName(), {
        include: [],
        exclude: [],
        dryRun: false,
        deps: 'deps.yaml',
        mode: 'interactive',
        policy: 'minor',
        prerelease: false,
      });
      const plain = Cli.stripAnsi(options[0]!.name);

      expect(plain).to.include('@elevenlabs/elevenlabs-js');
      expect(plain).to.include('blocked by policy');
    } finally {
      restore();
    }
  });

  it('pre-checks policy-selected rows and leaves blocked rows unchecked by default', () => {
    const options = Fmt.selectionOptions(upgrade(), {
      include: [],
      exclude: [],
      dryRun: false,
      deps: 'deps.yaml',
      mode: 'interactive',
      policy: 'minor',
      prerelease: false,
    });

    expect(options.map((option) => option.checked)).to.eql([true, false]);
  });

  it('formats cumulative registry spinner progress with clipped counts and percent', () => {
    const text = Fmt.spinnerProgress({
      kind: 'registry',
      registry: 'npm',
      current: { jsr: 2, npm: 17 },
      total: { jsr: 2, npm: 18 },
      completed: 19,
      dependencies: 20,
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.include('checking registry...');
    expect(plain).to.include('(jsr:2/2 npm:17/18) - 95%');
    expect(plain).to.include('jsr:2/2');
    expect(plain).to.include('npm:17/18');
    expect(plain).to.include('95%');
  });

  it('renders applied output with updated rows instead of planned totals', () => {
    const text = Cli.stripAnsi(Fmt.applied(applied()));

    expect(text).to.include('Updated');
    expect(text).to.not.include('Planned');
    expect(text).to.include('react-dom');
    expect(text).to.include('18.2.0');
    expect(text).to.include('19.0.0');
  });

  it('does not report updates when shorthand manifest versions normalize to the same pin', () => {
    const text = Cli.stripAnsi(Fmt.applied(appliedWithShorthandVersion()));

    expect(text).to.include('Updated');
    expect(text).to.not.include('approx-string-match');
  });

  it('formats the commit message with per-registry update counts', () => {
    expect(Fmt.commitMessage(applied())).to.eql(
      'chore(deps): upgraded 2 workspace dependencies - jsr:1, npm:1',
    );
  });

  it('omits empty registries from the commit message count suffix', () => {
    const result = appliedJsrOnly();
    expect(Fmt.commitMessage(result)).to.eql('chore(deps): upgraded @std/path - jsr:1');
  });
});

function upgrade(): t.WorkspaceUpgrade.Result {
  const pathDecision = decisionOk(
    '@std/path',
    '1.0.7',
    ['2.0.0', '1.2.0', '1.0.8', '1.0.7'],
    '1.2.0',
  );
  const reactDomDecision = decisionBlocked('react-dom', '18.2.0', ['18.2.0', '19.0.0']);
  const reactDecision = decisionBlocked('react', '18.2.0', ['18.2.0']);

  const nodes: t.EsmTopologicalInput['nodes'] = [
    {
      key: Fmt.key(pathDecision.input.subject.entry),
      value: pathDecision,
    },
  ];

  return {
    input: {
      cwd: '/workspace',
      deps: '/workspace/deps.yaml',
    },
    options: {
      policy: { mode: 'minor' },
      prerelease: false,
      registries: ['jsr', 'npm'],
      log: false,
    },
    totals: {
      dependencies: 3,
      allowed: 1,
      blocked: 2,
      planned: 1,
    },
    topological: {
      ok: true,
      items: [{ node: nodes[0], index: 0, after: [] }],
    },
    collect: {
      input: {
        cwd: '/workspace',
        deps: '/workspace/deps.yaml',
      },
      options: {
        policy: { mode: 'minor' },
        prerelease: false,
        registries: ['jsr', 'npm'],
        log: false,
      },
      candidates: [
        candidate('@std/path', '1.0.7', '2.0.0'),
        candidate('react-dom', '18.2.0', '19.0.0'),
        candidate('react', '18.2.0', '18.2.0'),
      ],
      totals: {
        dependencies: 3,
        collected: 3,
        skipped: 0,
        failed: 0,
      },
      uncollected: [],
    },
    graph: {
      nodes,
      edges: [],
      unresolved: [],
    },
    policy: {
      decisions: [pathDecision, reactDomDecision, reactDecision],
    },
  };
}

function upgradeWithOverrides(): t.WorkspaceUpgrade.Result {
  const monacoDecision = decisionOk(
    'monaco-editor',
    '0.55.1',
    ['0.56.0', '0.55.1'],
    '0.56.0',
  );
  const automergeDecision = decisionBlocked(
    '@automerge/automerge-repo',
    '2.5.6',
    ['2.6.0', '2.5.6'],
  );
  const dompurifyDecision = decisionOk(
    'dompurify',
    '3.4.0',
    ['3.5.0', '3.4.0'],
    '3.5.0',
  );
  const decisions = [monacoDecision, automergeDecision, dompurifyDecision];
  const nodes: t.EsmTopologicalInput['nodes'] = [monacoDecision, dompurifyDecision].map((
    decision,
  ) => ({
    key: Fmt.key(decision.input.subject.entry),
    value: decision,
  }));
  const base = upgrade();

  return {
    ...base,
    totals: {
      dependencies: 3,
      allowed: 2,
      blocked: 1,
      planned: 2,
    },
    collect: {
      ...base.collect,
      candidates: [
        candidate('monaco-editor', '0.55.1', '0.56.0'),
        candidate('@automerge/automerge-repo', '2.5.6', '2.6.0'),
        candidate('dompurify', '3.4.0', '3.5.0'),
      ],
      totals: {
        dependencies: 3,
        collected: 3,
        skipped: 0,
        failed: 0,
      },
      packageJson: {
        overrides: {
          '@automerge/automerge-repo': { uuid: '11.1.1' },
          'monaco-editor': { dompurify: '3.4.0' },
        },
      },
    },
    graph: {
      nodes,
      edges: [],
      unresolved: [],
    },
    topological: {
      ok: true,
      items: nodes.map((node, index) => ({ node, index, after: [] })),
    },
    policy: { decisions },
  };
}

function candidate(
  name: string,
  current: t.StringSemver,
  latest: t.StringSemver,
): t.WorkspaceUpgrade.Candidate {
  return {
    entry: entry(name, current),
    registry: registry(name),
    current,
    latest,
    available: [latest, current],
  };
}

function decisionOk(
  name: string,
  current: t.StringSemver,
  available: readonly t.StringSemver[],
  selected: t.StringSemver,
): t.EsmPolicyDecision {
  const input = policyInput(name, current, available);
  return {
    ok: true,
    input,
    selection: {
      current: { version: current, current: true },
      available: available.map((version) => ({
        version,
        ...(version === current ? { current: true } : {}),
        ...(version === available[0] ? { latest: true } : {}),
      })),
      selected: { version: selected, latest: selected === available[0] ? true : undefined },
    },
  };
}

function decisionBlocked(
  name: string,
  current: t.StringSemver,
  available: readonly t.StringSemver[],
): t.EsmPolicyDecision {
  const input = policyInput(name, current, available);
  return {
    ok: false,
    input,
    selection: {
      current: { version: current, current: true },
      available: available.map((version) => ({
        version,
        ...(version === current ? { current: true } : {}),
        ...(version === available[0] ? { latest: true } : {}),
      })),
    },
    reason: { code: 'version:not-allowed' },
  };
}

function applied(): t.WorkspaceUpgrade.ApplyResult {
  const result = upgrade();
  return {
    input: result.input,
    options: result.options,
    upgrade: result,
    entries: [entry('@std/path', '1.2.0'), entry('react-dom', '19.0.0'), entry('react', '18.2.0')],
    files: {
      yaml: {
        depsFilePath: '/workspace/deps.yaml',
        yaml: {
          obj: {},
          text: '',
          toString: () => '',
        },
      },
      deno: {
        kind: 'imports',
        denoFilePath: '/workspace/deno.json',
        targetPath: '/workspace/deno.json',
        imports: {},
      },
      package: {
        packageFilePath: '/workspace/package.json',
        dependencies: {},
        devDependencies: {},
        overrides: {},
      },
    },
  };
}

function topologyBlockedUpgrade(): t.WorkspaceUpgrade.Result {
  const result = upgrade();
  return {
    ...result,
    totals: {
      ...result.totals,
      planned: 0,
    },
    topological: {
      ok: false,
      cycle: {
        keys: ['jsr:@std/path', 'npm:react-dom'],
        path: ['jsr:@std/path', 'npm:react-dom', 'jsr:@std/path'],
      },
    },
  };
}

function upgradeWithLongScopedName(): t.WorkspaceUpgrade.Result {
  const result = upgrade();
  const decision = decisionBlocked(
    '@elevenlabs/elevenlabs-js',
    '2.41.1',
    ['2.42.0', '2.41.1'],
  );

  return {
    ...result,
    totals: {
      dependencies: 1,
      allowed: 0,
      blocked: 1,
      planned: 0,
    },
    collect: {
      ...result.collect,
      candidates: [candidate('@elevenlabs/elevenlabs-js', '2.41.1', '2.42.0')],
      totals: {
        dependencies: 1,
        collected: 1,
        skipped: 0,
        failed: 0,
      },
    },
    policy: {
      decisions: [decision],
    },
  };
}

function appliedWithShorthandVersion(): t.WorkspaceUpgrade.ApplyResult {
  const result = upgradeWithShorthandCurrent();
  return {
    input: result.input,
    options: result.options,
    upgrade: result,
    entries: [
      entry('@std/path', '1.2.0'),
      shorthandEntry('approx-string-match', '2'),
      entry('react-dom', '19.0.0'),
      entry('react', '18.2.0'),
    ],
    files: {
      yaml: {
        depsFilePath: '/workspace/deps.yaml',
        yaml: {
          obj: {},
          text: '',
          toString: () => '',
        },
      },
      deno: {
        kind: 'imports',
        denoFilePath: '/workspace/deno.json',
        targetPath: '/workspace/deno.json',
        imports: {},
      },
      package: {
        packageFilePath: '/workspace/package.json',
        dependencies: {},
        devDependencies: {},
        overrides: {},
      },
    },
  };
}

function appliedJsrOnly(): t.WorkspaceUpgrade.ApplyResult {
  const result = upgrade();
  return {
    ...applied(),
    upgrade: result,
    entries: [entry('@std/path', '1.2.0')],
  };
}

function entry(name: string, version: t.StringSemver): t.EsmDeps.Entry {
  return {
    module: Esm.parse(`${registry(name)}:${name}@${version}`),
    target: ['deno.json'],
  };
}

function shorthandEntry(name: string, version: string): t.EsmDeps.Entry {
  return {
    module: Esm.parse(`${registry(name)}:${name}@${version}`),
    target: ['deno.json'],
  };
}

function policyInput(
  name: string,
  current: t.StringSemver,
  available: readonly t.StringSemver[],
): t.EsmPolicyInput {
  return {
    policy: { mode: 'minor' },
    subject: {
      entry: entry(name, current),
      current,
      available,
    },
  };
}

function registry(name: string): t.EsmRegistry {
  return name.startsWith('@std/') ? 'jsr' : 'npm';
}

function upgradeWithShorthandCurrent(): t.WorkspaceUpgrade.Result {
  const result = upgrade();
  const approxDecision = decisionBlocked('approx-string-match', '2.0.0', ['2.0.0']);
  return {
    ...result,
    totals: {
      dependencies: 4,
      allowed: 1,
      blocked: 3,
      planned: 1,
    },
    collect: {
      ...result.collect,
      candidates: [
        result.collect.candidates[0],
        candidate('approx-string-match', '2.0.0', '2.0.0'),
        result.collect.candidates[1],
        result.collect.candidates[2],
      ],
      totals: {
        dependencies: 4,
        collected: 4,
        skipped: 0,
        failed: 0,
      },
    },
    policy: {
      decisions: [
        result.policy.decisions[0],
        approxDecision,
        result.policy.decisions[1],
        result.policy.decisions[2],
      ],
    },
  };
}

function expectSectionLabels(text: string, labels: readonly string[]) {
  const lines = text.split('\n');
  let previous = -1;

  labels.forEach((label) => {
    const index = lines.findIndex((line, lineIndex) => {
      return lineIndex > previous && line.startsWith(label);
    });
    expect(index).to.be.greaterThan(previous);
    previous = index;
  });
}

function chapterCommand(chapter: { readonly path: readonly string[] }): string {
  return ['deno run -ER jsr:@sys/workspace dsl', ...chapter.path].join(' ');
}

function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}

function stubScreenWidth(width: number): () => void {
  const screen = Cli.Screen as { size: () => { width: number; height: number } };
  const prev = screen.size;
  screen.size = () => ({ width, height: 24 });
  return () => {
    screen.size = prev;
  };
}

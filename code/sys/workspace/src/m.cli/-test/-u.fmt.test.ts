import { describe, expect, it, Cli, Esm, c, type t } from '../../-test.ts';
import { Fmt } from '../u.fmt.ts';

describe('Workspace.Cli.Fmt', () => {
  it('omits the duplicate candidates table from the interactive plan output', () => {
    const plan = Fmt.plan(upgrade());
    const text = Cli.stripAnsi(plan);

    expect(text).to.include('Policy');
    expect(text).to.include('Blocked');
    expect(text).to.include('Already latest');
    expect(text).to.not.include('Dependency   Current');
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
      apply: true,
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

  it('does not pre-check interactive rows without explicit include flags', () => {
    const options = Fmt.selectionOptions(upgrade(), {
      include: [],
      exclude: [],
      apply: true,
      deps: 'deps.yaml',
      mode: 'interactive',
      policy: 'minor',
      prerelease: false,
    });

    expect(options.every((option) => option.checked === false)).to.eql(true);
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
    expect(text).to.include(c.cyan('jsr:'));
    expect(text).to.include(c.cyan('npm:'));
    expect(text).to.include(c.white('95%'));
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
      cycle: { keys: ['jsr:@std/path', 'npm:react-dom'] },
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
      },
    },
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

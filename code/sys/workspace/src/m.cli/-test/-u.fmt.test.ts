import { describe, expect, it, Cli, Esm, c, type t } from '../../-test.ts';
import { Fmt } from '../u.fmt.ts';

describe('Workspace.Cli.Fmt', () => {
  it('omits the duplicate candidates table from the interactive plan output', () => {
    const plan = Fmt.plan(upgrade());
    const text = Cli.stripAnsi(plan);

    expect(text).to.include('Policy');
    expect(text).to.not.include('Dependency   Current');
  });

  it('aligns current → latest columns and colors blocked latest yellow', () => {
    const result = upgrade();
    const options = Fmt.selectionOptions(
      result,
      {
        include: [],
        exclude: [],
        apply: true,
        deps: 'deps.yaml',
        mode: 'interactive',
        policy: 'minor',
      },
    );
    const labels = options.map((option) => option.name);
    const plain = labels.map((label) => Cli.stripAnsi(label));
    const arrows = plain.map((label) => label.indexOf('→'));

    expect(arrows[0]).to.be.greaterThan(0);
    expect(arrows.every((index) => index === arrows[0])).to.eql(true);

    expect(labels[0]).to.include(c.green('1.0.8'));
    expect(labels[1]).to.include(c.yellow('19.0.0'));
    expect(labels[1]).to.include(c.gray(c.italic(' blocked by policy')));
    expect(labels[2]).to.include(c.yellow('19.0.0'));
  });

  it('renders applied output with updated rows instead of planned totals', () => {
    const text = Cli.stripAnsi(Fmt.applied(applied()));

    expect(text).to.include('Updated');
    expect(text).to.include('Applied');
    expect(text).to.not.include('Planned');
    expect(text).to.include('react-dom');
    expect(text).to.include('18.2.0');
    expect(text).to.include('19.0.0');
  });
});

function upgrade(): t.WorkspaceUpgrade.Result {
  const pathDecision = decisionOk('@std/path', '1.0.7', ['1.0.7', '1.0.8'], '1.0.8');
  const reactDomDecision = decisionBlocked('react-dom', '18.2.0', ['18.2.0', '19.0.0']);
  const reactDecision = decisionBlocked('react', '18.2.0', ['18.2.0', '19.0.0']);

  const nodes: t.EsmTopologicalInput['nodes'] = [
    {
      key: Fmt.key(pathDecision.input.subject.entry),
      decision: pathDecision,
    },
  ];

  return {
    input: {
      cwd: '/workspace',
      deps: '/workspace/deps.yaml',
    },
    options: {
      policy: { mode: 'minor' },
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
        registries: ['jsr', 'npm'],
        log: false,
      },
      candidates: [
        candidate('@std/path', '1.0.7', '1.0.8'),
        candidate('react-dom', '18.2.0', '19.0.0'),
        candidate('react', '18.2.0', '19.0.0'),
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
    entries: [
      entry('@std/path', '1.0.8'),
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
    },
  };
}

function entry(name: string, version: t.StringSemver): t.EsmDeps.Entry {
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

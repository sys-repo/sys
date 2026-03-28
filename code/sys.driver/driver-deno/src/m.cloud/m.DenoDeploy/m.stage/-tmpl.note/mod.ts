import { Fs, Is, Str, Time, type t } from '../../common.ts';
import { pkg } from '../../../../pkg.ts';

export type State = {
  readonly name: string;
  readonly version: string;
  readonly sourcePackage: string;
  readonly stageRoot: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly builder: string;
  readonly phase: string;
  readonly build: Phase;
  readonly stage: Phase;
  readonly prepare: Phase;
  readonly deploy: Phase;
  readonly verify: Phase;
};

type Phase = {
  readonly status: 'pending' | 'running' | 'ok' | 'failed';
  readonly facts?: readonly Fact[];
};

type Fact = {
  readonly label: string;
  readonly value: string;
};

export const FILE = 'DEPLOYMENT.md' as const;

export const DeploymentNote = {
  async create(args: {
    readonly name: string;
    readonly version: string;
    readonly sourcePackage: string;
    readonly stageRoot: string;
  }): Promise<State> {
    const now = timestamp();
    return {
      name: args.name,
      version: args.version,
      sourcePackage: args.sourcePackage,
      stageRoot: args.stageRoot,
      createdAt: now,
      updatedAt: now,
      builder: `${pkg.name}@${pkg.version}/cloud: DenoDeploy`,
      phase: 'created',
      build: { status: 'pending' },
      stage: { status: 'pending' },
      prepare: { status: 'pending' },
      deploy: { status: 'pending' },
      verify: { status: 'pending' },
    };
  },

  buildStarted(input: State): State {
    return DeploymentNote.update(input, {
      phase: 'building',
      build: { status: 'running' },
    });
  },

  async buildDone(input: State, args: { readonly pkgDir: string; readonly elapsed: t.Msecs }): Promise<State> {
    const bytes = await dirBytes(Fs.join(args.pkgDir, 'dist'));
    return DeploymentNote.update(input, {
      phase: 'built',
      build: {
        status: 'ok',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'bundle size', value: Str.bytes(bytes) },
        ],
      },
    });
  },

  buildFailed(input: State, args: { readonly elapsed: t.Msecs; readonly error: unknown }): State {
    return DeploymentNote.update(input, {
      phase: 'failed',
      build: {
        status: 'failed',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'error', value: message(args.error) },
        ],
      },
    });
  },

  stageStarted(input: State): State {
    return DeploymentNote.update(input, {
      phase: 'staging',
      stage: { status: 'running' },
    });
  },

  async stageDone(input: State, args: { readonly stageRoot: string; readonly elapsed: t.Msecs }): Promise<State> {
    const bytes = await dirBytes(args.stageRoot, ['node_modules']);
    return DeploymentNote.update(input, {
      phase: 'staged',
      stage: {
        status: 'ok',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'staged size (excluding node_modules)', value: Str.bytes(bytes) },
        ],
      },
    });
  },

  stageFailed(input: State, args: { readonly elapsed: t.Msecs; readonly error: unknown }): State {
    return DeploymentNote.update(input, {
      phase: 'failed',
      stage: {
        status: 'failed',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'error', value: message(args.error) },
        ],
      },
    });
  },

  prepareStarted(input: State): State {
    return DeploymentNote.update(input, {
      phase: 'preparing',
      prepare: { status: 'running' },
    });
  },

  prepareDone(input: State, args: { readonly elapsed: t.Msecs }): State {
    return DeploymentNote.update(input, {
      phase: 'prepared',
      prepare: {
        status: 'ok',
        facts: [{ label: 'elapsed', value: formatElapsed(args.elapsed) }],
      },
    });
  },

  prepareFailed(input: State, args: { readonly elapsed: t.Msecs; readonly error: unknown }): State {
    return DeploymentNote.update(input, {
      phase: 'failed',
      prepare: {
        status: 'failed',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'error', value: message(args.error) },
        ],
      },
    });
  },

  deployStarted(input: State): State {
    return DeploymentNote.update(input, {
      phase: 'deploying',
      deploy: { status: 'running' },
    });
  },

  deployDone(input: State, args: {
    readonly elapsed: t.Msecs;
    readonly revision?: string;
    readonly preview?: string;
    readonly verify: boolean;
  }): State {
    return DeploymentNote.update(input, {
      phase: args.verify ? 'verifying' : 'complete',
      deploy: {
        status: 'ok',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          ...(args.revision ? [{ label: 'revision', value: args.revision }] : []),
          ...(args.preview ? [{ label: 'preview', value: args.preview }] : []),
        ],
      },
      ...(args.verify ? { verify: { status: 'running' as const } } : {}),
    });
  },

  deployFailed(input: State, args: { readonly elapsed: t.Msecs; readonly error: unknown }): State {
    return DeploymentNote.update(input, {
      phase: 'failed',
      deploy: {
        status: 'failed',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'error', value: message(args.error) },
        ],
      },
    });
  },

  verifyStarted(input: State): State {
    return DeploymentNote.update(input, {
      phase: 'verifying',
      verify: { status: 'running' },
    });
  },

  verifyDone(input: State, args: { readonly elapsed: t.Msecs }): State {
    return DeploymentNote.update(input, {
      phase: 'complete',
      verify: {
        status: 'ok',
        facts: [{ label: 'elapsed', value: formatElapsed(args.elapsed) }],
      },
    });
  },

  verifyFailed(input: State, args: { readonly elapsed: t.Msecs; readonly error: unknown }): State {
    return DeploymentNote.update(input, {
      phase: 'failed',
      verify: {
        status: 'failed',
        facts: [
          { label: 'elapsed', value: formatElapsed(args.elapsed) },
          { label: 'error', value: message(args.error) },
        ],
      },
    });
  },

  async write(root: string, state: State) {
    await Fs.write(Fs.join(root, FILE), render(state), { force: true });
  },

  update(input: State, patch: Partial<Omit<State, 'updatedAt'>>) {
    return {
      ...input,
      ...patch,
      updatedAt: timestamp(),
    };
  },
} as const;

function render(input: State) {
  const lines = [
    '# Deno Deploy Staging Root',
    '',
    `- name: \`${input.name}\``,
    `- version: \`${input.version}\``,
    `- source package: \`${input.sourcePackage}\``,
    `- stage root: \`${input.stageRoot}\``,
    `- created at: \`${input.createdAt}\``,
    `- builder: \`${input.builder}\``,
    '',
    'This directory is a generated staging artifact for Deno Deploy.',
    'This is a snapshot, not the original workspace package.',
    '',
    '## Status',
    '',
    `- phase: \`${input.phase}\``,
    `- updated at: \`${input.updatedAt}\``,
    '',
    '## Audit Log',
    '',
    `- created: \`${input.createdAt}\` ${ok}`,
    ...renderPhase('build', input.build),
    ...renderPhase('stage', input.stage),
    ...renderPhase('prepare', input.prepare),
    ...renderPhase('deploy', input.deploy),
    ...renderPhase('verify', input.verify),
    '',
  ];
  return lines.join('\n');
}

function renderPhase(label: string, input: Phase) {
  return [
    `- ${label}: \`${input.status}\`${input.status === 'ok' ? ` ${ok}` : ''}`,
    ...(input.facts ?? []).map((fact) => `  - ${fact.label}: \`${fact.value}\``),
  ];
}

const ok = '✅';

function timestamp() {
  return Time.now.date.toISOString();
}

function formatElapsed(input: t.Msecs) {
  return Time.duration(input).format({ round: 1 });
}

function message(error: unknown) {
  return Is.error(error) ? error.message : String(error);
}

async function dirBytes(root: string, exclude: readonly string[] = []): Promise<number> {
  if (!(await Fs.exists(root))) return 0;

  let total = 0;

  for await (const entry of Deno.readDir(root)) {
    if (exclude.includes(entry.name)) continue;
    const path = Fs.join(root, entry.name);
    if (entry.isDirectory) {
      total += await dirBytes(path, exclude);
      continue;
    }
    if (entry.isFile) total += (await Deno.stat(path)).size;
  }

  return total;
}

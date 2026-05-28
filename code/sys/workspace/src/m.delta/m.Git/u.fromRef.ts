import { Fs, Path, Process, type t } from '../common.ts';
import { WorkspaceBump } from '../../m.bump/mod.ts';
import { WorkspaceGraph } from '../../m.graph/mod.ts';
import { dependentClosure } from '../u/u.closure.ts';
import { nameStatusRecordsFromNul } from '../u/u.git.ts';
import { classify } from './u.classify.ts';
import { fromNameStatus } from './u.fromNameStatus.ts';

/**
 * Derive package delta facts from one git baseline ref.
 */
export async function fromRef(args: t.WorkspaceDelta.Git.FromRefArgs) {
  const cwd = args.cwd ?? Fs.cwd();
  const ref = wrangle.ref(args.ref);
  const head = args.head ? wrangle.ref(args.head) : 'HEAD';
  const graphPath = args.graphPath ?? Path.join(cwd, 'deno.graph.json');
  const snapshot = await WorkspaceGraph.Snapshot.read(graphPath);
  if (!snapshot) throw new Error(`Workspace graph snapshot not found: ${graphPath}`);

  const collect = await WorkspaceBump.collect({
    cwd,
    release: args.release,
    orderedPaths: snapshot.graph.orderedPaths,
    edges: snapshot.graph.edges,
    policy: args.policy,
  });
  const nameStatus = await wrangle.nameStatus({ cwd, ref, head });
  const delta = fromNameStatus({ collect, nameStatus });
  const classification = await classify({ cwd, ref, collect, delta });
  const bumpRootPkgPaths = classification.needsBumpPkgPaths;
  const bumpClosurePkgPaths = dependentClosure(bumpRootPkgPaths, collect.edges, collect.orderedPaths);

  return {
    ...delta,
    collect,
    ref,
    head,
    graphPath,
    alreadyBumpedPkgPaths: classification.alreadyBumpedPkgPaths,
    needsBumpPkgPaths: classification.needsBumpPkgPaths,
    newPkgPaths: classification.newPkgPaths,
    bumpRootPkgPaths,
    bumpClosurePkgPaths,
  };
}

const wrangle = {
  ref(ref: string) {
    const trimmed = ref.trim();
    if (!trimmed) throw new Error('Git baseline ref is required.');
    return trimmed;
  },

  async nameStatus(args: {
    readonly cwd: t.StringDir;
    readonly ref: string;
    readonly head: string;
  }) {
    const output = await Process.invoke({
      cmd: 'git',
      cwd: args.cwd,
      args: ['diff', '--name-status', '-z', `${args.ref}..${args.head}`, '--'],
      silent: true,
    });
    if (!output.success) {
      const msg = output.text.stderr.trim() || output.text.stdout.trim();
      throw new Error(`Git diff failed for ${args.ref}..${args.head}: ${msg}`);
    }
    return nameStatusRecordsFromNul(output.text.stdout);
  },
} as const;

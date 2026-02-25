import { type t, Is } from '../common.ts';

export type EvalArtifacts = {
  readonly assets?: unknown;
  readonly playback?: unknown;
  readonly tree?: unknown;
};

export type EvalIssue = {
  readonly kind: string;
  readonly severity?: string;
  readonly path?: string;
  readonly raw?: string;
  readonly message?: string;
};

export type EvalRunResultMeta = {
  readonly issues?: readonly EvalIssue[];
  readonly dir?: {
    readonly base?: string;
    readonly manifests?: string;
    readonly video?: string;
    readonly image?: string;
  };
};

export type EvalRunOutput = {
  readonly context: {
    readonly docid: t.StringId;
    readonly outDir: t.StringDir;
  };
  readonly files: {
    readonly assets?: t.StringFile;
    readonly playback?: t.StringFile;
    readonly tree?: t.StringFile;
  };
  readonly artifacts: EvalArtifacts;
  readonly result?: EvalRunResultMeta;
};

export function normalizeRun(output: EvalRunOutput): EvalRunOutput {
  const result = output.result
    ? {
        ...output.result,
        ...(output.result.issues
          ? {
              issues: [...output.result.issues].sort(compareIssue),
            }
          : {}),
      }
    : undefined;

  return {
    ...output,
    artifacts: {
      ...(output.artifacts.assets !== undefined
        ? { assets: canonicalize(output.artifacts.assets) }
        : {}),
      ...(output.artifacts.playback !== undefined
        ? { playback: canonicalize(output.artifacts.playback) }
        : {}),
      ...(output.artifacts.tree !== undefined ? { tree: canonicalize(output.artifacts.tree) } : {}),
    },
    ...(result ? { result } : {}),
  };
}

function compareIssue(a: EvalIssue, b: EvalIssue): number {
  const ka = `${a.kind}|${a.path ?? ''}|${a.raw ?? ''}|${a.message ?? ''}`;
  const kb = `${b.kind}|${b.path ?? ''}|${b.raw ?? ''}|${b.message ?? ''}`;
  return ka.localeCompare(kb);
}

function canonicalize(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (Is.array(input)) return input.map((item) => canonicalize(item));
  if (Is.record(input)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort((a, b) => a.localeCompare(b))) {
      const value = (input as Record<string, unknown>)[key];
      if (value === undefined) continue;
      out[key] = canonicalize(value);
    }
    return out;
  }
  return input;
}


import { Is, StdPath, Str, type t } from './common.ts';
import { failure, isFailure } from './u.error.ts';

const compare = Str.Compare.codeUnit();

export const INTERNAL_NAME = '.sys-rooted';

// deno-lint-ignore no-control-regex -- Portable paths reject ASCII and C1 controls.
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const WINDOWS = {
  DEVICE: /^(con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i,
  RESERVED: /[:"<>|?*]/,
} as const;

export type NormalizedTarget<K extends t.FsRooted.TargetKind = t.FsRooted.TargetKind> = {
  readonly kind: K;
  readonly path: t.StringRelativePath;
};

/**
 * Apply Rooted's portable lexical policy to one complete target batch.
 *
 * This pure package-private seam is shared with strict Dist verification so
 * publication and verification cannot drift onto different path grammars.
 */
export function normalizeTargets<K extends t.FsRooted.TargetKind>(
  input: readonly t.FsRooted.TargetInput<K>[],
): readonly NormalizedTarget<K>[] {
  const operation = 'admit';
  if (!Is.array(input)) throw failure(operation, 'invalid-target');

  const targets = input.map((item) => {
    if (!Is.object(item)) throw failure(operation, 'invalid-target');
    if (!(item.kind === 'file' || item.kind === 'directory')) {
      throw failure(operation, 'invalid-target');
    }

    let path: t.StringRelativePath;
    try {
      path = StdPath.Bounded.visible(
        StdPath.Bounded.posix(),
        item.path,
        () => failure(operation, 'invalid-target'),
      );
    } catch (cause) {
      if (isFailure(cause)) throw cause;
      throw failure(operation, 'invalid-target', { cause });
    }

    if (!path) throw failure(operation, 'invalid-target');
    for (const segment of path.split('/')) validateSegment(segment);
    return { kind: item.kind, path };
  });

  const ordered = [...targets].sort((a, b) => compare(a.path, b.path));
  const byPath = new Map<string, NormalizedTarget>();
  for (const target of ordered) {
    if (byPath.has(target.path)) throw failure(operation, 'target-collision');
    byPath.set(target.path, target);
  }

  for (const target of ordered) {
    let separator = target.path.indexOf('/');
    while (separator >= 0) {
      const ancestor = target.path.slice(0, separator);
      if (byPath.get(ancestor)?.kind === 'file') {
        throw failure(operation, 'target-collision');
      }
      separator = target.path.indexOf('/', separator + 1);
    }
  }

  return targets;
}

function validateSegment(segment: string): void {
  const lower = segment.toLowerCase();
  if (
    !segment ||
    segment.endsWith('.') ||
    segment.endsWith(' ') ||
    CONTROL.test(segment) ||
    WINDOWS.RESERVED.test(segment) ||
    WINDOWS.DEVICE.test(segment) ||
    lower.startsWith(INTERNAL_NAME)
  ) {
    throw failure('admit', 'invalid-target');
  }
}

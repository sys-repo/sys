import type {
  GuardResult,
  OcrExecutables,
  OcrPdfParams,
  OcrPdfPolicy,
  OcrPolicy,
  PageRange,
} from './t.ts';
import { blocked, toErrorMessage } from './u.result.ts';
import {
  hasGlobChars,
  hasParentSegment,
  isAbsolutePath,
  relativePath,
  resolvePath,
} from './u.path.ts';

export async function guardInput(input: {
  readonly requested: string;
  readonly cwd: string;
  readonly policy: OcrPolicy;
}): Promise<GuardResult> {
  let requested = '';
  try {
    requested = input.requested.trim();
    return await guardInputUnsafe(input, requested);
  } catch (error) {
    return blocked(requested, undefined, `ocr_pdf input guard failed: ${toErrorMessage(error)}`);
  }
}

export function guardExecutables(executables: OcrExecutables) {
  for (const [name, value] of Object.entries(executables)) {
    if (!value) {
      return {
        ok: false as const,
        reason: `OCR dependency executable is missing from generated policy: ${name}.`,
      };
    }
    if (!isAbsolutePath(value)) {
      return {
        ok: false as const,
        reason: `OCR dependency executable must be an absolute path: ${name}.`,
      };
    }
  }
  return { ok: true as const };
}

export function resolveLanguage(input: string | undefined, policy: OcrPdfPolicy) {
  const language = input?.trim() || policy.defaultLanguage;
  if (policy.languages.includes(language)) return { ok: true as const, value: language };
  return {
    ok: false as const,
    reason:
      `OCR language is not allowed by active profile policy: ${language}. Allowed languages: ${
        policy.languages.join(', ')
      }.`,
  };
}

export function parsePdfInfoPages(stdout: string) {
  const match = /^Pages:\s*([0-9]+)\s*$/im.exec(stdout);
  if (!match) return undefined;
  const count = Number(match[1]);
  if (!Number.isSafeInteger(count) || count < 1) return undefined;
  return count;
}

export function resolvePageRange(params: OcrPdfParams, pagesTotal: number, maxPages: number) {
  const pageStart = params.pageStart ?? 1;
  const pageEnd = params.pageEnd ?? Math.min(pagesTotal, pageStart + maxPages - 1);

  if (!Number.isInteger(pageStart) || pageStart < 1) {
    return { ok: false as const, reason: 'ocr_pdf pageStart must be a positive integer.' };
  }
  if (!Number.isInteger(pageEnd) || pageEnd < 1) {
    return { ok: false as const, reason: 'ocr_pdf pageEnd must be a positive integer.' };
  }
  if (pageStart > pageEnd) {
    return {
      ok: false as const,
      reason: 'ocr_pdf pageStart must be less than or equal to pageEnd.',
    };
  }
  if (pageEnd > pagesTotal) {
    return {
      ok: false as const,
      reason: `ocr_pdf pageEnd exceeds PDF page count (${pagesTotal}).`,
    };
  }

  const pagesRequested = pageEnd - pageStart + 1;
  if (pagesRequested > maxPages) {
    return {
      ok: false as const,
      reason: `ocr_pdf page range exceeds active profile policy maxPages (${maxPages}).`,
    };
  }

  return { ok: true as const, value: { pageStart, pageEnd, pagesRequested } satisfies PageRange };
}

async function guardInputUnsafe(
  input: {
    readonly requested: string;
    readonly cwd: string;
    readonly policy: OcrPolicy;
  },
  requested: string,
): Promise<GuardResult> {
  const policy = input.policy;
  if (!requested) return blocked(requested, undefined, 'ocr_pdf requires a non-empty PDF path.');
  if (requested.startsWith('~')) {
    return blocked(requested, undefined, 'ocr_pdf does not expand ~ paths.');
  }
  if (hasParentSegment(requested)) {
    return blocked(requested, undefined, 'ocr_pdf refuses paths containing .. segments.');
  }
  if (hasGlobChars(requested)) {
    return blocked(requested, undefined, 'ocr_pdf refuses glob-shaped paths.');
  }

  const resolved = resolvePath(input.cwd, requested);
  const readRoot = findContainingRoot(resolved, policy.readRoots);
  if (!readRoot) {
    return blocked(
      requested,
      resolved,
      `ocr_pdf source is outside configured readable sandbox roots: ${resolved}`,
    );
  }
  if (isInsideAny(resolved, policy.protectedRoots)) {
    return blocked(requested, resolved, 'ocr_pdf refuses protected control/runtime paths.');
  }

  let info: Deno.FileInfo | undefined;
  try {
    info = await lstat(resolved);
  } catch (error) {
    return blocked(
      requested,
      resolved,
      `ocr_pdf could not inspect source path: ${toErrorMessage(error)}`,
    );
  }
  if (!info) return blocked(requested, resolved, `ocr_pdf source does not exist: ${resolved}`);

  let intermediate: Awaited<ReturnType<typeof guardIntermediateSymlinks>>;
  try {
    intermediate = await guardIntermediateSymlinks(readRoot, resolved);
  } catch (error) {
    return blocked(
      requested,
      resolved,
      `ocr_pdf could not inspect source parents: ${toErrorMessage(error)}`,
    );
  }
  if (!intermediate.ok) return blocked(requested, resolved, intermediate.reason);

  if (info.isSymlink) {
    return blocked(requested, resolved, 'ocr_pdf refuses final-path symlink sources.');
  }
  if (!info.isFile) {
    return blocked(requested, resolved, 'ocr_pdf source must be a regular PDF file.');
  }
  if (!resolved.toLowerCase().endsWith('.pdf')) {
    return blocked(requested, resolved, 'ocr_pdf source must have a .pdf extension.');
  }

  return { ok: true, requested, resolved, root: readRoot };
}

async function lstat(path: string): Promise<Deno.FileInfo | undefined> {
  try {
    return await Deno.lstat(path);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

async function guardIntermediateSymlinks(root: string, target: string) {
  const relative = relativePath(root, target);
  const segments = relative.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const intermediates = segments.slice(0, -1);
  let current = root;

  for (const segment of intermediates) {
    current = resolvePath(current, segment);
    const info = await lstat(current);
    if (!info) return { ok: false as const, reason: `ocr_pdf parent does not exist: ${current}` };
    if (info.isSymlink) {
      return {
        ok: false as const,
        reason: `ocr_pdf refuses intermediate symlink traversal: ${current}`,
      };
    }
  }

  return { ok: true as const };
}

function findContainingRoot(target: string, roots: readonly string[]) {
  return roots.find((root) => isWithinOrEqual(root, target));
}

function isInsideAny(target: string, roots: readonly string[]) {
  return roots.some((root) => isWithinOrEqual(root, target));
}

function isWithinOrEqual(root: string, target: string) {
  const relative = relativePath(root, target);
  return relative === '' || (!relative.startsWith('..') && !isAbsolutePath(relative));
}

function isNotFound(error: unknown) {
  return error instanceof Deno.errors.NotFound ||
    (error instanceof Error && error.name === 'NotFound');
}

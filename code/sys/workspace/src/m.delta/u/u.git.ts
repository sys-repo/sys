import { Is, type t } from '../common.ts';

/**
 * Convert git name-status records into workspace-root-relative changed file paths.
 */
export function changedFilesFromNameStatus(
  input: readonly t.WorkspaceDelta.Git.NameStatusInput[],
) {
  return input.flatMap((item) => Is.str(item) ? pathsFromLine(item) : pathsFromRecord(item));
}

/**
 * Parse NUL-delimited output from `git diff --name-status -z`.
 */
export function nameStatusRecordsFromNul(input: string) {
  const tokens = input.split('\0').filter((token) => token.length > 0);
  const records: t.WorkspaceDelta.Git.NameStatusRecord[] = [];
  let cursor = 0;

  // Cursor loop required: git name-status records consume two or three NUL-delimited tokens.
  while (cursor < tokens.length) {
    const status = tokens[cursor++];
    if (!status) throw malformedNul(input);

    if (isRename(status) || isCopy(status)) {
      const previousPath = tokens[cursor++];
      const path = tokens[cursor++];
      if (!previousPath || !path) throw malformedNul(input);
      records.push({ status, previousPath, path });
      continue;
    }

    const path = tokens[cursor++];
    if (!path) throw malformedNul(input);
    records.push({ status, path });
  }

  return records;
}

/**
 * Helpers:
 */
function pathsFromLine(line: string) {
  if (line.trim().length === 0) return [];

  const parts = line.split('\t');
  const [status] = parts;
  if (!status) throw malformed(line);

  if (isRename(status)) return pathsFromRenameLine(line, parts);
  if (isCopy(status)) return pathsFromCopyLine(line, parts);
  return pathsFromSinglePathLine(line, parts);
}

function pathsFromRecord(record: t.WorkspaceDelta.Git.NameStatusRecord) {
  if (!record.status) throw new Error('Malformed git name-status record: missing status.');
  if (!record.path) {
    throw new Error(`Malformed git name-status record ${record.status}: missing path.`);
  }

  if (isRename(record.status)) {
    if (!record.previousPath) {
      throw new Error(`Malformed git rename record ${record.status}: missing previousPath.`);
    }
    return [record.previousPath, record.path];
  }

  return [record.path];
}

function pathsFromRenameLine(line: string, parts: readonly string[]) {
  if (parts.length !== 3 || !parts[1] || !parts[2]) throw malformed(line);
  return [parts[1], parts[2]];
}

function pathsFromCopyLine(line: string, parts: readonly string[]) {
  if (parts.length !== 3 || !parts[1] || !parts[2]) throw malformed(line);
  return [parts[2]];
}

function pathsFromSinglePathLine(line: string, parts: readonly string[]) {
  if (parts.length !== 2 || !parts[1]) throw malformed(line);
  return [parts[1]];
}

function isRename(status: string) {
  return status.startsWith('R');
}

function isCopy(status: string) {
  return status.startsWith('C');
}

function malformed(line: string) {
  return new Error(`Malformed git name-status line: ${line}`);
}

function malformedNul(input: string) {
  return new Error(`Malformed NUL-delimited git name-status output: ${input}`);
}

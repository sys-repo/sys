import type { CopyDetails, MoveDetails, RemoveDetails, TextBlock } from './t.ts';

export function toRemoveSuccess(path: string, resolved: string, recursive: boolean) {
  const details: RemoveDetails = { ok: true, path, resolved, recursive };
  return {
    content: [textBlock(`Removed: ${resolved}`)],
    details,
  };
}

export function toRemoveError(path: string, resolved: string, recursive: boolean, reason: string) {
  const details: RemoveDetails = { ok: false, path, resolved, recursive, reason };
  return {
    content: [textBlock(`Remove failed: ${reason}`)],
    details,
    isError: true,
  };
}

export function toMoveSuccess(from: string, to: string, resolvedFrom: string, resolvedTo: string) {
  const details: MoveDetails = { ok: true, from, to, resolvedFrom, resolvedTo };
  return {
    content: [textBlock(`Moved: ${resolvedFrom} → ${resolvedTo}`)],
    details,
  };
}

export function toMoveError(
  from: string,
  to: string,
  resolvedFrom: string,
  resolvedTo: string,
  reason: string,
) {
  const details: MoveDetails = { ok: false, from, to, resolvedFrom, resolvedTo, reason };
  return {
    content: [textBlock(`Move failed: ${reason}`)],
    details,
    isError: true,
  };
}

export function toCopySuccess(from: string, to: string, resolvedFrom: string, resolvedTo: string) {
  const details: CopyDetails = { ok: true, from, to, resolvedFrom, resolvedTo };
  return {
    content: [textBlock(`Copied: ${resolvedFrom} → ${resolvedTo}`)],
    details,
  };
}

export function toCopyError(
  from: string,
  to: string,
  resolvedFrom: string,
  resolvedTo: string,
  reason: string,
) {
  const details: CopyDetails = { ok: false, from, to, resolvedFrom, resolvedTo, reason };
  return {
    content: [textBlock(`Copy failed: ${reason}`)],
    details,
    isError: true,
  };
}

export function toMoveErrorMessage(from: string, to: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    return `Filesystem write permission denied for move ${from} → ${to}; add both paths to sandbox.capability.write. ${message}`;
  }
  return `Filesystem move failed for ${from} → ${to}: ${message}`;
}

export function toCopyErrorMessage(from: string, to: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    return `Filesystem permission denied for copy ${from} → ${to}; add source read and destination write sandbox capability. ${message}`;
  }
  return `Filesystem copy failed for ${from} → ${to}: ${message}`;
}

export function toFsErrorMessage(action: string, target: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    return `Filesystem permission denied for ${target}; update sandbox capability for ${action}. ${message}`;
  }
  return `Filesystem ${action} failed for ${target}: ${message}`;
}

function textBlock(text: string): TextBlock {
  return { type: 'text', text };
}

function isPermissionDenied(error: unknown) {
  return error instanceof Error && error.name === 'PermissionDenied';
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

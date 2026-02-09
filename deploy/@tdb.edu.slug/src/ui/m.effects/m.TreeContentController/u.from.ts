import { type t } from './common.ts';

export function fromSelectionChanged(key?: string): t.TreeContentController.Patch {
  return {
    phase: 'idle',
    key,
    request: undefined,
    data: undefined,
    error: undefined,
  };
}

export function fromLoadStart(
  request: t.TreeContentController.Request,
): t.TreeContentController.Patch {
  return {
    phase: 'loading',
    key: request.key,
    request,
    data: undefined,
    error: undefined,
  };
}

export function fromLoadCancel(
  current: t.TreeContentController.State,
  requestId: string,
): t.TreeContentController.Patch | undefined {
  const active = current.request;
  if (!active || active.id !== requestId) return undefined;
  return {
    phase: 'idle',
    request: undefined,
    data: undefined,
    error: undefined,
  };
}

export function fromLoadSucceed(
  current: t.TreeContentController.State,
  next: {
    readonly request: t.TreeContentController.Request;
    readonly data: t.TreeContentController.Content;
  },
): t.TreeContentController.Patch | undefined {
  const active = current.request;
  if (!active) return undefined;
  if (active.id !== next.request.id) return undefined;
  if (active.key !== next.request.key) return undefined;

  return {
    phase: 'ready',
    key: next.request.key,
    request: undefined,
    data: next.data,
    error: undefined,
  };
}

export function fromLoadFail(
  current: t.TreeContentController.State,
  next: {
    readonly request: t.TreeContentController.Request;
    readonly message: string;
  },
): t.TreeContentController.Patch | undefined {
  const active = current.request;
  if (!active) return undefined;
  if (active.id !== next.request.id) return undefined;
  if (active.key !== next.request.key) return undefined;

  return {
    phase: 'error',
    key: next.request.key,
    request: undefined,
    data: undefined,
    error: { message: next.message },
  };
}

import { Is, StartGuiIntrinsic, type t } from '../common.ts';

import { isPromiseTransport } from '../u.promise.ts';
import { captureUrl } from '../u.url.ts';
import type {
  KeyboardCleanupOwner,
  KeyboardOwnerSnapshot,
  ScreenCleanupOwner,
  ScreenOwner,
  ScreenOwnerSnapshot,
  StatusCleanupOwner,
  StatusOwnerSnapshot,
} from './t.ts';

/** Copy one narrow status owner without retaining its raw listener facade. */
export function snapshotStatusOwner(input: unknown): StatusOwnerSnapshot {
  if (!Is.object(input) || Is.Native.proxy(input)) return INVALID_STATUS_OWNER;
  const closeProperty = directData(input, 'close');
  if (
    !closeProperty.ok || !Is.func(closeProperty.value) || Is.Native.proxy(closeProperty.value)
  ) return INVALID_STATUS_OWNER;

  const closeMethod = closeProperty.value as StatusCleanupOwner['close'];
  const finishedProperty = directData(input, 'finished');
  const finished = finishedProperty.ok && isPromiseTransport(finishedProperty.value)
    ? finishedProperty.value as Promise<void>
    : undefined;
  const cleanupOwner: StatusCleanupOwner = StartGuiIntrinsic.freeze({
    ...(finished ? { finished } : {}),
    close(reason?: unknown) {
      return StartGuiIntrinsic.invoke(closeMethod, [reason]) as Promise<void>;
    },
  });
  const urlProperty = directData(input, 'url');
  if (!finished || !urlProperty.ok || !isStatusUrl(urlProperty.value)) {
    return StartGuiIntrinsic.freeze({ kind: 'invalid', owner: cleanupOwner });
  }
  return StartGuiIntrinsic.freeze({
    kind: 'admitted',
    owner: StartGuiIntrinsic.freeze({ ...cleanupOwner, finished, url: urlProperty.value }),
  });
}

export function snapshotKeyboardOwner(input: unknown): KeyboardOwnerSnapshot {
  if (!Is.object(input) || Is.Native.proxy(input)) return INVALID_KEYBOARD_OWNER;
  const disposeProperty = directData(input, 'dispose');
  if (
    !disposeProperty.ok || !Is.func(disposeProperty.value) || Is.Native.proxy(disposeProperty.value)
  ) return INVALID_KEYBOARD_OWNER;

  const disposeMethod = disposeProperty.value as KeyboardCleanupOwner['dispose'];
  const cleanupOwner: KeyboardCleanupOwner = StartGuiIntrinsic.freeze({
    dispose() {
      StartGuiIntrinsic.invoke(disposeMethod, []);
    },
  });
  const finishedProperty = directData(input, 'finished');
  if (!finishedProperty.ok || !isPromiseTransport(finishedProperty.value)) {
    return StartGuiIntrinsic.freeze({ kind: 'invalid', owner: cleanupOwner });
  }
  return StartGuiIntrinsic.freeze({
    kind: 'admitted',
    owner: StartGuiIntrinsic.freeze({
      ...cleanupOwner,
      finished: finishedProperty.value as Promise<void>,
    }),
  });
}

export function snapshotScreenOwner(input: unknown): ScreenOwnerSnapshot {
  if (!Is.object(input) || Is.Native.proxy(input)) return INVALID_SCREEN_OWNER;
  const disposeProperty = directData(input, 'dispose');
  if (
    !disposeProperty.ok || !Is.func(disposeProperty.value) || Is.Native.proxy(disposeProperty.value)
  ) return INVALID_SCREEN_OWNER;

  const disposeMethod = disposeProperty.value as ScreenCleanupOwner['dispose'];
  const cleanupOwner: ScreenCleanupOwner = StartGuiIntrinsic.freeze({
    dispose() {
      StartGuiIntrinsic.invoke(disposeMethod, []);
    },
  });
  const kind = directData(input, 'kind');
  const failure = directData(input, 'failure');
  const redraw = directData(input, 'redraw');
  const warnOpen = directData(input, 'warnOpen');
  if (
    !kind.ok || (kind.value !== 'acquired' && kind.value !== 'failed' &&
      kind.value !== 'unavailable') ||
    !failure.ok || !isPromiseTransport(failure.value) ||
    !redraw.ok || !Is.func(redraw.value) || Is.Native.proxy(redraw.value) ||
    !warnOpen.ok || !Is.func(warnOpen.value) || Is.Native.proxy(warnOpen.value)
  ) return StartGuiIntrinsic.freeze({ kind: 'invalid', owner: cleanupOwner });

  const redrawMethod = redraw.value as ScreenOwner['redraw'];
  const warnOpenMethod = warnOpen.value as ScreenOwner['warnOpen'];
  return StartGuiIntrinsic.freeze({
    kind: 'admitted',
    owner: StartGuiIntrinsic.freeze({
      ...cleanupOwner,
      kind: kind.value,
      failure: failure.value as Promise<never>,
      redraw() {
        StartGuiIntrinsic.invoke(redrawMethod, []);
      },
      warnOpen() {
        StartGuiIntrinsic.invoke(warnOpenMethod, []);
      },
    }),
  });
}

function directData(
  input: object,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const descriptor = StartGuiIntrinsic.ownPropertyDescriptor(input, key);
    return descriptor && 'value' in descriptor
      ? StartGuiIntrinsic.freeze({ ok: true as const, value: descriptor.value })
      : DATA_UNAVAILABLE;
  } catch {
    return DATA_UNAVAILABLE;
  }
}

function isStatusUrl(input: unknown): input is t.StringUrl {
  if (!Is.string(input) || input.length > 4_096) return false;
  const url = captureUrl(input);
  return url !== undefined && url.protocol === 'http:' && url.hostname === '127.0.0.1' &&
    url.port.length > 0 && url.port !== '0' && !url.username && !url.password && !url.search &&
    !url.hash &&
    isStatusCapabilityPath(url.pathname) && `${url.origin}${url.pathname}` === input;
}

function isStatusCapabilityPath(input: string): boolean {
  if (
    input.length < 26 || input.length > 129 ||
    StartGuiIntrinsic.stringCharCodeAt(input, 0) !== 0x2f
  ) return false;
  for (let index = 1; index < input.length; index += 1) {
    const code = StartGuiIntrinsic.stringCharCodeAt(input, index);
    const digit = code >= 0x30 && code <= 0x39;
    const lower = code >= 0x61 && code <= 0x7a;
    if (!digit && !lower) return false;
  }
  return true;
}

const INVALID_STATUS_OWNER: StatusOwnerSnapshot = StartGuiIntrinsic.freeze({ kind: 'invalid' });
const INVALID_KEYBOARD_OWNER: KeyboardOwnerSnapshot = StartGuiIntrinsic.freeze({ kind: 'invalid' });
const INVALID_SCREEN_OWNER: ScreenOwnerSnapshot = StartGuiIntrinsic.freeze({ kind: 'invalid' });
const DATA_UNAVAILABLE = StartGuiIntrinsic.freeze({ ok: false as const });

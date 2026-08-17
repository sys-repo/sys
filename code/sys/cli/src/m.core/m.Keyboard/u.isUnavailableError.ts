import { Is } from './common.ts';

export function isUnavailableError(error: unknown): boolean {
  if (!Is.object(error)) return false;
  try {
    if (Is.proxy(error) || !Is.nativeError(error)) return false;
    const name = ownString(error, 'name');
    if (name === 'BadResource') return true;
    const message = ownString(error, 'message');
    return message !== undefined &&
      /ENODEV|ENOTTY|No such device|Not a typewriter/i.test(message);
  } catch {
    return false;
  }
}

function ownString(input: object, key: 'message' | 'name'): string | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && 'value' in descriptor && Is.string(descriptor.value)
    ? descriptor.value
    : undefined;
}

import {
  DATE_GET_TIME,
  REGEXP_DOT_ALL_GET,
  REGEXP_GLOBAL_GET,
  REGEXP_HAS_INDICES_GET,
  REGEXP_IGNORE_CASE_GET,
  REGEXP_MULTILINE_GET,
  REGEXP_SOURCE_GET,
  REGEXP_STICKY_GET,
  REGEXP_UNICODE_GET,
  REGEXP_UNICODE_SETS_GET,
} from './u.kernel.intrinsics.ts';

/**
 * Value comparison for supported scalar built-ins.
 */
export function equalDates(a: Date, b: Date) {
  return Object.is(DATE_GET_TIME.call(a), DATE_GET_TIME.call(b));
}

export function equalRegExps(a: RegExp, b: RegExp) {
  return REGEXP_SOURCE_GET.call(a) === REGEXP_SOURCE_GET.call(b) &&
    REGEXP_GLOBAL_GET.call(a) === REGEXP_GLOBAL_GET.call(b) &&
    REGEXP_IGNORE_CASE_GET.call(a) === REGEXP_IGNORE_CASE_GET.call(b) &&
    REGEXP_MULTILINE_GET.call(a) === REGEXP_MULTILINE_GET.call(b) &&
    REGEXP_DOT_ALL_GET.call(a) === REGEXP_DOT_ALL_GET.call(b) &&
    REGEXP_UNICODE_GET.call(a) === REGEXP_UNICODE_GET.call(b) &&
    REGEXP_STICKY_GET.call(a) === REGEXP_STICKY_GET.call(b) &&
    callOptionalGetter(REGEXP_HAS_INDICES_GET, a) ===
      callOptionalGetter(REGEXP_HAS_INDICES_GET, b) &&
    callOptionalGetter(REGEXP_UNICODE_SETS_GET, a) ===
      callOptionalGetter(REGEXP_UNICODE_SETS_GET, b);
}

function callOptionalGetter<T extends object, R>(getter: ((this: T) => R) | undefined, value: T) {
  return getter?.call(value);
}

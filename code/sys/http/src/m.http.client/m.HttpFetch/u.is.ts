import { type t, Is } from './common.ts';

export function isFetch(input?: unknown): input is t.HttpFetch {
  if (!Is.record(input)) return false;
  const obj = input as t.HttpFetch;
  return (
    Is.record(obj.headers) &&
    Is.func(obj.header) &&
    Is.func(obj.head) &&
    Is.func(obj.json) &&
    Is.func(obj.text) &&
    Is.func(obj.blob) &&
    Is.func(obj.head) &&
    Is.disposable(input)
  );
}

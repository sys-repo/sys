import { A, Is, Time, type t } from './common.ts';
import { toHandle } from './u.ts';

type O = Record<string, unknown>;

/**
 * Stamp a commit message/timestamp into the document history.
 */
export const Tag = {
  commit<T extends O>(
    doc: t.Doc<T> | t.DocHandle<T>,
    message: string,
    options: { time?: t.UnixTimestamp | boolean } = {},
  ) {
    const handle = wrangle.handle(doc);
    const time = wrangle.timestamp(options.time);
    const current = handle.docSync();
    if (current) A.emptyChange(current, { message, time });
    return { message, time } as const;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  timestamp(input?: t.UnixTimestamp | boolean) {
    if (input === false) return undefined;
    if (input === true || input === undefined) return Time.now.timestamp;
    return input;
  },

  handle<T extends O>(input: t.Doc<T> | t.DocHandle<T>): t.DocHandle<T> {
    if (Is.handle(input)) return input as t.DocHandle<T>;
    return toHandle(input as t.Doc<T>);
  },
} as const;

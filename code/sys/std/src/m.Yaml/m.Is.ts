import { type t, ERR, Err } from './common.ts';

export const Is: t.YamlIsLib = {
  parseError(input) {
    if (!input || !Err.Is.errorLike(input)) return false;
    const err = input as t.StdError;
    if (err.name === ERR.PARSE) return true;
    if (err.cause?.name === ERR.PARSE) return true;
    return false;
  },
};

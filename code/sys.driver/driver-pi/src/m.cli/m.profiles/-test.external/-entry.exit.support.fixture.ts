export type * as t from '../../../common/t.ts';

export const Pi = Object.freeze({});
export const pkg = Object.freeze({});

export const TaskCli = Object.freeze({
  input(argv: readonly string[] = []) {
    return Promise.resolve({ argv });
  },
});

import { Is, type t } from '../common.ts';

type Deps = {
  load: t.Cell.Lib['load'];
  run: t.Cell.Task.Lib['run'];
};

type RawArgs = [input: unknown, nameOrOptions?: unknown, options?: unknown];

type Args = {
  target?: t.Cell.Instance | t.StringDir;
  name: t.Cell.Id;
  options?: t.Cell.Task.Run.Options;
};

/**
 * Create the root happy-path `Cell.task(...)` method implementation.
 */
export function createTaskMethod(deps: Deps): t.Cell.Lib['task'] {
  const task: t.Cell.Lib['task'] = async (...raw: RawArgs) => {
    const args = wrangle.args(raw);
    const cell = isCellInstance(args.target) ? args.target : await deps.load(args.target);
    return deps.run(cell, args.name, args.options);
  };

  return task;
}

/**
 * Helpers:
 */
const wrangle = {
  args(raw: RawArgs): Args {
    const [input, nameOrOptions, options] = raw;
    if (isCellInstance(input)) {
      if (!Is.str(nameOrOptions)) throw new TypeError('Cell.task: task name is required.');
      return {
        target: input,
        name: nameOrOptions,
        options: options as t.Cell.Task.Run.Options | undefined,
      };
    }

    if (!Is.str(input)) {
      throw new TypeError('Cell.task: expected a Cell instance, Cell root path, or task name.');
    }

    if (Is.str(nameOrOptions)) {
      return {
        target: input,
        name: nameOrOptions,
        options: options as t.Cell.Task.Run.Options | undefined,
      };
    }

    return {
      name: input,
      options: nameOrOptions as t.Cell.Task.Run.Options | undefined,
    };
  },
} as const;

function isCellInstance(value: unknown): value is t.Cell.Instance {
  if (!Is.record(value)) return false;
  if (!Is.str(value.root)) return false;
  if (!Is.record(value.paths)) return false;
  if (!Is.str(value.paths.descriptor)) return false;
  if (!Is.record(value.descriptor)) return false;
  return value.descriptor.kind === 'cell';
}

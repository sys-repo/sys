import { Obj, type t } from './common.ts';

/**
 * Fake CLI spinner for tests that inject spinner handles.
 */
export const FakeSpinner: t.FakeSpinner.Lib = {
  create(text = ''): t.FakeSpinner.Instance {
    const spinner: t.FakeSpinner.Instance = {
      text,
      status: 'idle',
      starts: 0,
      stops: 0,
      succeeds: 0,
      fails: 0,
      renders: 0,

      start(next) {
        if (next !== undefined) spinner.text = next;
        spinner.starts += 1;
        spinner.status = 'spinning';
        return spinner;
      },

      stop() {
        spinner.stops += 1;
        spinner.status = 'stopped';
        return spinner;
      },

      succeed(next) {
        if (next !== undefined) spinner.text = next;
        spinner.succeeds += 1;
        spinner.status = 'succeeded';
        spinner.stop();
        spinner.status = 'succeeded';
        return spinner;
      },

      fail(next) {
        if (next !== undefined) spinner.text = next;
        spinner.fails += 1;
        spinner.status = 'failed';
        spinner.stop();
        spinner.status = 'failed';
        return spinner;
      },

      render() {
        spinner.renders += 1;
        return spinner;
      },
    };

    return spinner;
  },

  adapter(args = {}) {
    const spinner = args.spinner ?? FakeSpinner.create();
    const calls: t.FakeSpinner.AdapterCall[] = [];
    const create: t.FakeSpinner.Adapter['create'] = (text, options) => {
      calls.push({
        text,
        options: options === undefined ? undefined : Obj.clone(options),
      });
      return spinner;
    };
    return { spinner, calls, create };
  },
};

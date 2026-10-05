import { Total } from '../TestSuite.helpers/mod.ts';
import { type t, Time } from './common.ts';

export function Progress(
  onProgress: t.SuiteRunProgress | undefined,
  args: {
    model: t.TestSuiteModel;
    tx: string;
    beforeEach?: t.BeforeRunTest;
    afterEach?: t.AfterRunTest;
  },
) {
  const { model, tx } = args;
  const id = { suite: model.id, tx };
  const timer = Time.timer();
  const total = Total.count(model);
  let completed = 0;

  const getProgress = (): t.SuiteRunProgressArgs['progress'] => {
    const percent = total.runnable === 0 ? 0 : completed / total.runnable;
    return {
      percent: Number(percent.toFixed(2)),
      total: total.runnable,
      completed,
    };
  };

  const getCommon = () => {
    const progress = getProgress();
    const elapsed = timer.elapsed.msec;
    return { id, total, progress, elapsed };
  };

  const beforeAll = () => {
    onProgress?.({
      op: 'run:suite:start',
      ...getCommon(),
    });
  };

  const before: t.BeforeRunTest = (e) => {
    args.beforeEach?.(e);
    onProgress?.({
      op: 'run:test:before',
      ...getCommon(),
      description: e.description,
    });
  };

  const after: t.AfterRunTest = (e) => {
    completed++;
    args.afterEach?.(e);
    onProgress?.({
      op: 'run:test:after',
      ...getCommon(),
      result: e.result,
      description: e.description,
    });
  };

  const afterAll = () => {
    onProgress?.({
      op: 'run:suite:complete',
      ...getCommon(),
    });
  };

  /**
   * API
   */
  return {
    total,
    beforeAll,
    before,
    after,
    afterAll,
    onProgress,
  } as const;
}

import { Is, type t } from './common.ts';

type FinishedHandle = { readonly finished: Promise<unknown> };

export const wait: t.Cell.Runtime.Lib['wait'] = async (runtime) => {
  const finished = runtime.services
    .map((service) => service.started)
    .filter((started): started is FinishedHandle =>
      Is.record(started) && Is.promise(started.finished)
    )
    .map((server) => server.finished);

  if (finished.length === 0) return;
  await Promise.race(finished);
};

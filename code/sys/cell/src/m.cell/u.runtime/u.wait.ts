import { Is, type t } from './common.ts';

export const wait: t.Cell.Runtime.Lib['wait'] = async (runtime) => {
  const finished = runtime.services
    .map((service) => service.started)
    .filter(Is.waitableHandle)
    .map((service) => service.finished);

  if (finished.length === 0) return;
  await Promise.race(finished);
};

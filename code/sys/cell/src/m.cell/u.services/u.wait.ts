import { Is, type t } from './common.ts';

export const wait: t.Cell.Services.Lib['wait'] = async (started) => {
  const finished = started.services
    .map((service) => service.handle)
    .filter(Is.waitableHandle)
    .map((handle) => handle.finished);

  if (finished.length === 0) return;
  await Promise.race(finished);
};

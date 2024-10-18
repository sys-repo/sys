import { DevBus } from '../../u.Bus/mod.ts';
import { Time, rx, slug, type t } from '../common.ts';

type Results = { ok: boolean; elapsed: t.Msecs; total: number; specs: ModuleResults[] };
type ModuleResults = { ok: boolean; name: string; results?: t.TestSuiteRunResponse };

/**
 * Run a set of tests headlessly.
 * Useful for running within a server-side test suite.
 */
export async function headless(input: t.SpecImports): Promise<Results> {
  const timer = Time.timer();
  const imports = Object.values(input);

  const specs: ModuleResults[] = [];
  const response: Results = {
    ok: true,
    total: 0,
    elapsed: 0,
    get specs() {
      return specs;
    },
  };

  const wait = imports.map(async (fn) => {
    const name = fn.name;
    const instance = { bus: rx.bus(), id: `headless.${slug()}` };
    const controller = DevBus.Controller({ instance });
    const root = await fn();

    await controller.load.fire(root.default);
    const res = await controller.run.fire();
    controller.dispose();

    const results = res.info?.run.results;
    const ok = results?.ok ?? false;

    specs.push({ ok, name, results });
  });

  await Promise.all(wait);

  response.ok = specs.every((item) => item.ok);
  response.total = specs.length;
  response.elapsed = timer.elapsed.msec;

  return response;
}

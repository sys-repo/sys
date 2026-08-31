import { describe, expect, Fs, it } from '../../-test.ts';

type DenoConfig = {
  readonly tasks?: Record<string, string>;
};

describe('@sys/cell sample task projection', () => {
  it('keeps Cell sample tasks explicit and deploy local-stage-only', async () => {
    const config = await readConfig(new URL('../../../deno.json', import.meta.url));
    const tasks = config.tasks ?? {};

    expect(tasks['sample:stripe']).to.eql(
      'deno run -P=sample @sys/cell start ./-sample/cell.stripe --reporter auto',
    );
    expect(tasks['sample:deploy:start']).to.eql(
      'deno run -P=sample @sys/cell start ./-sample/cell.deploy --reporter auto',
    );
    expect(tasks['sample:deploy']).to.eql(
      'deno run -P=sample-deploy --cached-only --frozen --no-prompt --ignore-env --deny-env --deny-net --deny-run --deny-sys --deny-ffi @sys/cell task sample:deploy ./-sample/cell.deploy',
    );
    expect(tasks['sample:deploy:prep']).to.eql(undefined);
    expect(tasks['sample:vite']).to.eql(
      'deno run -P=sample @sys/cell start ./-sample/cell.vite --reporter auto',
    );
    expect(tasks['sample:vite:dev']).to.eql(
      'deno run -P=sample-vite-dev @sys/cell start ./-sample/cell.vite --mode dev --reporter auto',
    );
  });

  it('keeps @sys/ui dev and serve tasks explicit about the automatic reporter policy', async () => {
    const config = await readConfig(
      new URL('../../../../../sys.ui/ui/deno.json', import.meta.url),
    );
    const tasks = config.tasks ?? {};

    expect(tasks.dev).to.eql(
      'deno run -P=dev ./-scripts/task.cell.ts --mode dev --reporter auto',
    );
    expect(tasks.serve).to.eql('deno run -P=dev ./-scripts/task.cell.ts --reporter auto');
  });
});

/**
 * Helpers:
 */
async function readConfig(url: URL): Promise<DenoConfig> {
  const path = Fs.Path.fromFileUrl(url);
  const result = await Fs.readJson<DenoConfig>(path);
  if (!result.ok) throw result.error;
  return result.data ?? {};
}

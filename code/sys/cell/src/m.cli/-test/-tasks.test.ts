import { describe, expect, Fs, it } from '../../-test.ts';
import { parseArgs } from '../u/u.args.ts';

type DenoConfig = {
  readonly tasks?: Record<string, string>;
};

describe('@sys/cell sample task projection', () => {
  it('keeps Cell sample tasks explicit and deploy local-stage-only', async () => {
    const config = await readConfig(new URL('../../../deno.json', import.meta.url));
    const tasks = config.tasks ?? {};

    expect(tasks.cli).to.eql('deno run -P=cli ./-scripts/task.cli.ts');
    expect(tasks['test:proofs']).to.eql('deno task test:cli:vite');
    expect(tasks['test:cli:vite']).to.eql(
      'deno test -P=test --trace-leaks ./src/m.cli/-test/-task.cli.vite.process.ts',
    );
    expect(tasks['test:cli:vite:signals']).to.eql(
      'deno test -P=test --trace-leaks ./src/m.cli/-test/-task.cli.vite.signals.process.ts',
    );
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
      'deno run -A @sys/cell start ./-sample/cell.vite --mode dev --reporter auto',
    );
  });

  for (const task of ['dev', 'serve']) {
    it(`@sys/ui ${task} → explicitly passes --reporter auto to Cell`, async () => {
      const { cellArgs } = await readUiLauncher(task);
      expect(parseArgs(['start', '.', ...cellArgs]).reporter).to.eql('auto');
    });

    // Keep the opt-in until the minimum supported Deno version no longer needs it.
    it(`@sys/ui ${task} → opts in to Deno's corrected request cancellation`, async () => {
      const { denoArgs } = await readUiLauncher(task);
      expect(denoArgs).to.include('--unstable-no-legacy-abort');
    });
  }
});

/**
 * Helpers:
 */
async function readUiLauncher(task: string) {
  const config = await readConfig(new URL('../../../../../sys.ui/ui/deno.json', import.meta.url));
  const command = config.tasks?.[task] ?? '';

  // These launchers are simple commands. Fail on shell syntax rather than guessing at argv.
  expect(command, `@sys/ui ${task} must be a direct deno run command`).to.match(
    /^[ \t]*deno[ \t]+run(?:[ \t]+[-\w./=:,@%+]+)+[ \t]*$/,
  );
  const args = command.trim().split(/[ \t]+/).slice(2);
  const entry = args.indexOf('./-scripts/task.cell.ts');
  expect(entry, `@sys/ui ${task} must launch task.cell.ts`).to.be.at.least(0);
  return { denoArgs: args.slice(0, entry), cellArgs: args.slice(entry + 1) };
}

async function readConfig(url: URL): Promise<DenoConfig> {
  const path = Fs.Path.fromFileUrl(url);
  const result = await Fs.readJson<DenoConfig>(path);
  if (!result.ok) throw result.error;
  return result.data ?? {};
}

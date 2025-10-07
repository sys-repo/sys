import { Args } from './common.ts';
import { makeBundle } from './u.makeBundle.ts';

export async function entry() {
  type A = { bundle?: boolean; dryRun?: boolean; force?: boolean };
  const { bundle, dryRun, force, _ } = Args.parse<A>(Deno.args);
  if (bundle) {
    await makeBundle();
  } else {
    const { cli } = await import('./u.cli.ts');
    await cli({ dryRun, force, tmpl: _[0] });
  }
}

import { runVite } from '../../../-scripts/u.cli.vite.ts';
import { Path } from '../../-test.ts';

const entry = Path.fromFileUrl(new URL('./u.fixture.cli.vite.child.ts', import.meta.url));
Deno.exitCode = await runVite(Deno.args, entry);

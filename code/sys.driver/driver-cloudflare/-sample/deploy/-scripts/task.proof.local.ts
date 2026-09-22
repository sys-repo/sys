import { prove } from './u.proof.ts';
import { runTask } from './u.task.ts';

/**
 * Run the sample's local proof.
 */
Deno.exitCode = await runTask('proof:local', () => prove());

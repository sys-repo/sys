/**
 * Run CI scripts in sequence.
 */
await import('./cmd.ci.dry.ts');
await import('./cmd.ci.test.ts');
await import('./cmd.info.ts');

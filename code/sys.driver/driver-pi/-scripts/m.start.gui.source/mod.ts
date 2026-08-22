import { DIST_DIR, loadGuiDistSource } from './u.source.ts';
import { startGuiDistSource } from './u.runtime.ts';

export type { GuiDistSource, GuiDistSourceStarted, SourceStartDependencies } from './t.ts';
export { loadGuiDistSource } from './u.source.ts';
export { startGuiDistSource, startGuiDistSourceWith } from './u.runtime.ts';

/** Start the operator-owned GUI Dist source and retain foreground listener ownership. */
export async function main(): Promise<void> {
  const source = await loadGuiDistSource(DIST_DIR);
  const started = await startGuiDistSource(source);
  await started.finished;
}

import type { Subscription } from 'rxjs';
import type { t } from './common.ts';

/**
 * Wait until Monaco attaches a TextModel to the editor.
 * Resolves with the model, or `undefined` if the lifecycle is disposed first.
 */
export async function waitForModel(
  editor: t.Monaco.Editor,
  life?: t.Lifecycle,
): Promise<t.Monaco.TextModel | undefined> {
  const existing = editor.getModel();
  if (existing) return existing;

  return new Promise<t.Monaco.TextModel | undefined>((resolve) => {
    const modelSub = editor.onDidChangeModel(() => {
      const m = editor.getModel();
      if (m) {
        modelSub.dispose();
        cancelSub?.unsubscribe?.();
        resolve(m);
      }
    });

    let cancelSub: Subscription | undefined;
    if (life) {
      cancelSub = life.dispose$.subscribe(() => {
        modelSub.dispose();
        cancelSub?.unsubscribe?.();
        resolve(undefined);
      });
    }
  });
}

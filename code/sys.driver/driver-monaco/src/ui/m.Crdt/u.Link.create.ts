import { type t, Err } from './common.ts';

export const create: t.EditorCrdtLinkCreateDoc = (ctx, repo, bounds) => {
  const editor = ctx.editor;
  const fail = (err: string) => ({ error: Err.std(err) });

  // 1. Create the CRDT doc and form the token.
  const doc = repo.create({});
  const uri = `crdt:${doc.id}`;

  // 2. Guard: operate only on the originating editor's current model.
  const model = editor.getModel?.();
  if (!model) return fail(`The editor does not have a model`);
  if (model.uri.toString(true) !== bounds.model.uri.toString(true)) {
    return fail(`The editor's model URI does not match the URI on the clicked link`);
  }

  // 3. Replace the link text at the given range.
  const { range, startOffset } = bounds;
  editor.executeEdits('crdt.link.create', [{ range, text: uri, forceMoveMarkers: true }]);

  // 4. Move caret to end of inserted token and reveal.
  const after = model.getPositionAt(startOffset + uri.length);
  editor.setPosition(after);
  editor.revealPositionInCenterIfOutsideViewport?.(after);

  // Finish up.
  return { doc };
};

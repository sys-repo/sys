import { TreeData } from '../../m.data/mod.ts';
import { type t, Is } from './common.ts';
import { toFileData, toPlaybackData } from './u.data.ts';
import { renderFileLeaf, renderFileMain } from './ui.file.tsx';
import { renderPlaybackLeaf, renderPlaybackMain } from './ui.playback.tsx';

export function createContentSlots(args: t.ContentSlotsArgs): t.TreeHostSlots {
  const source = args.content.phase === 'ready' ? args.content : args.lastReady;
  const data = Is.record(source?.data) ? (source.data as t.ContentData) : undefined;
  const file = toFileData(data);
  const playback = toPlaybackData(data);

  return {
    main: renderMain({ ...args, file, playback }),
    aux: (
      <div>{args.content.phase === 'error' ? (args.content.error?.message ?? 'Error') : ''}</div>
    ),
    treeLeaf: (e) => {
      const node = TreeData.findViewNode(args.selection.tree, args.selection.selectedPath);
      const isSelectedLeaf = !!node && node.key === e.node.key;
      if (!isSelectedLeaf) return undefined;
      return renderLeaf({ ...args, file, playback });
    },
  };
}

function renderMain(
  args: t.ContentSlotsArgs & {
    file?: t.FileContentData;
    playback?: t.PlaybackContentData;
  },
) {
  if (args.loading && !args.file && !args.playback) return <div>{'Loading content'}</div>;
  return (
    renderFileMain({ file: args.file, loading: args.loading, theme: args.theme }) ??
    renderPlaybackMain({ playback: args.playback, loading: args.loading, theme: args.theme })
  );
}

function renderLeaf(
  args: t.ContentSlotsArgs & {
    readonly file?: t.FileContentData;
    readonly playback?: t.PlaybackContentData;
  },
) {
  if (args.loading && !args.file && !args.playback) return <div>{'Loading content'}</div>;
  return (
    renderFileLeaf({ file: args.file, loading: args.loading, theme: args.theme }) ??
    renderPlaybackLeaf({ playback: args.playback, loading: args.loading, theme: args.theme }) ?? (
      <div>{'Leaf selected (no content loaded)'}</div>
    )
  );
}

import { type t, TreeData } from './common.ts';
import { toContentData, toFileData, toPlaybackData } from './u.data.ts';
import { FileLeaf, FileMain } from './ui.file.tsx';
import { PlaybackLeaf, PlaybackMain } from './ui.playback.tsx';

export function createSlots(args: t.ContentSlotsArgs): t.TreeHostSlots {
  const source = args.content.phase === 'ready' ? args.content : args.lastReady;
  const data = toContentData(source?.data);
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
  if (args.file) return <FileMain file={args.file} loading={args.loading} theme={args.theme} />;
  if (args.playback)
    return <PlaybackMain playback={args.playback} loading={args.loading} theme={args.theme} />;
  return undefined;
}

function renderLeaf(
  args: t.ContentSlotsArgs & {
    readonly file?: t.FileContentData;
    readonly playback?: t.PlaybackContentData;
  },
) {
  if (args.loading && !args.file && !args.playback) return <div>{'Loading content'}</div>;
  if (args.file) return <FileLeaf file={args.file} loading={args.loading} theme={args.theme} />;
  if (args.playback)
    return <PlaybackLeaf playback={args.playback} loading={args.loading} theme={args.theme} />;
  return <div>{'Leaf selected (no content loaded)'}</div>;
}

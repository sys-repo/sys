import { type t, TreeData } from './common.ts';
import { toContentData, toFileData, toPlaybackData } from './u.data.ts';
import { FileLeaf, FileMain } from './ui.file.tsx';
import { PlaybackLeaf, PlaybackMain } from './ui.playback.tsx';

type A = t.ContentSlotArgs;

export function createSlots(args: A): t.TreeHostSlots {
  const data = toContentData(args.content.data);
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

function renderMain(args: A & { file?: t.FileContentData; playback?: t.PlaybackContentData }) {
  if (args.file) return <FileMain file={args.file} theme={args.theme} />;
  if (args.playback) return <PlaybackMain playback={args.playback} theme={args.theme} />;
  return undefined;
}

function renderLeaf(args: A & { file?: t.FileContentData; playback?: t.PlaybackContentData }) {
  if (args.file) return <FileLeaf file={args.file} theme={args.theme} />;
  if (args.playback) return <PlaybackLeaf playback={args.playback} theme={args.theme} />;
  return undefined;
}

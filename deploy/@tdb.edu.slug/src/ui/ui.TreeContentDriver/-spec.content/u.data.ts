import { type t, Is } from './common.ts';

export function toFileData(data?: t.ContentData): t.FileContentData | undefined {
  if (!data || data.kind !== 'file-content') return undefined;
  return data as t.FileContentData;
}

export function toPlaybackData(data?: t.ContentData): t.PlaybackContentData | undefined {
  if (!data || data.kind !== 'playback-content') return undefined;
  return data as t.PlaybackContentData;
}

export function toFrontmatter(content: unknown) {
  if (!Is.record(content)) return undefined;
  const frontmatter = content.frontmatter;
  return Is.record(frontmatter) ? frontmatter : undefined;
}

export function arraySize(input: unknown): number {
  return Array.isArray(input) ? input.length : 0;
}

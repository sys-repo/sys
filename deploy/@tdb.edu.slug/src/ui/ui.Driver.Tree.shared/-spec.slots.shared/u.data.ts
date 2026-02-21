import { type t, Is } from './common.ts';

export function toFileData(data?: t.ContentData): t.FileContentData | undefined {
  if (!data) return undefined;
  return data.kind === 'file-content' ? data : undefined;
}

export function toPlaybackData(data?: t.ContentData): t.PlaybackContentData | undefined {
  if (!data) return undefined;
  return data.kind === 'playback-content' ? data : undefined;
}

export function toContentData(input: unknown): t.ContentData | undefined {
  if (!Is.record(input)) return undefined;
  const kind = input.kind;
  if (kind === 'file-content' || kind === 'playback-content') {
    return input as t.ContentData;
  }
  return undefined;
}

export function toFrontmatter(content: unknown) {
  if (!Is.record(content)) return undefined;
  return Is.record(content.frontmatter) ? content.frontmatter : undefined;
}

export function arraySize(input: unknown): number {
  return Array.isArray(input) ? input.length : 0;
}

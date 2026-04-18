import { type t, Is, Path } from './common.ts';

export const localPath: t.EsmIsLib['localPath'] = (input) => {
  const text = Is.str(input) ? input.trim() : input.name.trim();
  if (!text) return false;
  if (text.startsWith('./') || text.startsWith('../')) return true;
  if (Path.Is.absolute(text)) return true;
  if (!text.startsWith('file:///') || text === 'file:///') return false;

  try {
    Path.fromFileUrl(text);
    return true;
  } catch {
    return false;
  }
};

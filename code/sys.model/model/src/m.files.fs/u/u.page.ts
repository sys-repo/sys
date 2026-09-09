import {
  type Page,
  page as pageFiles,
  type PageArgs,
  type PageInput,
  validatePageInput as validateFilesPageInput,
} from '../../m.files/u/u.page.ts';
import { type t } from '../common.ts';
import { fail } from './u.error.ts';

export type { Page, PageArgs, PageInput };

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

export const validatePageInput = <K extends t.Files.Cursor.Kind>(args: PageInput<K>): void => {
  validateFilesPageInput(args, invalidPath);
};

export const page = <K extends t.Files.Cursor.Kind, T>(args: PageArgs<K, T>): Page<T, K> => {
  return pageFiles(args, invalidPath);
};

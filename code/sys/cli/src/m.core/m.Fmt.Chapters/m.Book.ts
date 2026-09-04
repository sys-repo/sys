import { Is, Str, type t } from '../common.ts';
import { files, resolve } from './u.resources.ts';

type O = Record<string, unknown>;

type Options<TFile extends string> = {
  readonly root: t.CliFormatChapters.Chapter.Resource<TFile>;
  readonly read: t.CliFormatChapters.Book.Reader<TFile>;
  readonly label: string;
  readonly noun: string;
  readonly recordKind: string;
};

/** Reusable chapter-book loader for authored chapter resources. */
export const Book: t.CliFormatChapters.Book.Lib = Object.freeze({
  create<TFile extends string>(input: t.CliFormatChapters.Book.Input<TFile>) {
    const options = wrangle.options(input);

    return {
      root: input.root,
      files: () => files(input.root),
      resolve: (path = []) => resolve(input.root, path),
      load: (path = []) => load(path, options),
    };
  },
});

/**
 * Helpers:
 */

async function load<TFile extends string>(
  path: readonly string[],
  options: Options<TFile>,
): Promise<t.CliFormatChapters.Chapter> {
  const resource = resolve(options.root, path);
  if (!resource) throw new Error(`${options.label}: ${options.noun} not found: ${path.join(' ')}`);
  return await readChapter(resource, path, options);
}

async function readChapter<TFile extends string>(
  resource: t.CliFormatChapters.Chapter.Resource<TFile>,
  path: readonly string[],
  options: Options<TFile>,
): Promise<t.CliFormatChapters.Chapter> {
  const data = await readRecord(resource.file, ['id', 'title', 'summary', 'sections'], options);
  const id = string(data, 'id', options);
  assertChapterId(resource.file, id, resource.id, options);

  return {
    id,
    path,
    title: string(data, 'title', options),
    summary: string(data, 'summary', options),
    sections: sections(data, 'sections', options),
    chapters: await readChapterLinks(path, resource.children, options),
  };
}

async function readChapterLinks<TFile extends string>(
  parentPath: readonly string[],
  resources: readonly t.CliFormatChapters.Chapter.Resource<TFile>[],
  options: Options<TFile>,
): Promise<readonly t.CliFormatChapters.Chapter.Link[]> {
  return await Promise.all(
    resources.map(async (resource) => {
      const data = await readRecord(resource.file, ['id', 'title', 'summary'], options);
      const id = string(data, 'id', options);
      assertChapterId(resource.file, id, resource.id, options);
      return {
        id,
        path: [...parentPath, id],
        title: string(data, 'title', options),
        summary: string(data, 'summary', options),
      };
    }),
  );
}

function readRecord<TFile extends string>(
  file: TFile,
  fields: readonly string[],
  options: Options<TFile>,
): Promise<O> {
  return Promise.resolve(options.read(file)).then((data) => {
    if (!Is.record<O>(data)) {
      throw new Error(`${options.label}: resource must be a ${options.recordKind}: ${file}`);
    }
    requireFields(data, fields, options);
    return data;
  });
}

function requireFields<TFile extends string>(
  data: O,
  fields: readonly string[],
  options: Options<TFile>,
) {
  fields.forEach((field) => {
    if (!(field in data)) throw new Error(`${options.label}: missing field: ${field}`);
  });
}

function string<TFile extends string>(data: O, field: string, options: Options<TFile>): string {
  const value = data[field];
  if (!Is.str(value)) throw new Error(`${options.label}: field must be a string: ${field}`);
  return Str.trimEdgeNewlines(value);
}

function sections<TFile extends string>(
  data: O,
  field: string,
  options: Options<TFile>,
): readonly t.CliFormatChapters.Section[] {
  const value = data[field];
  if (!Is.array<O>(value) || !value.every(isSectionRecord)) {
    throw new Error(`${options.label}: field must be a section record list: ${field}`);
  }
  return value.map((item) => ({
    label: item.label,
    items: sectionItems(item.items),
  }));
}

function sectionItems(input: string | readonly string[]): readonly string[] {
  if (Is.str(input)) {
    return Str.trimEdgeNewlines(input).split('\n').filter((line) => line.length > 0);
  }
  return input;
}

function isSectionRecord(input: unknown): input is {
  readonly label: string;
  readonly items: string | readonly string[];
} {
  return Is.record<{ readonly label: unknown; readonly items: unknown }>(input) &&
    Is.str(input.label) && (Is.str(input.items) || isStringList(input.items));
}

function isStringList(input: unknown): input is readonly string[] {
  return Is.array<string>(input) && input.every(Is.str);
}

function assertChapterId<TFile extends string>(
  file: TFile,
  id: string,
  expected: string,
  options: Options<TFile>,
) {
  if (id !== expected) {
    throw new Error(
      `${options.label}: ${options.noun} id mismatch: ${file} (${id} !== ${expected})`,
    );
  }
}

const wrangle = {
  options<TFile extends string>(input: t.CliFormatChapters.Book.Input<TFile>): Options<TFile> {
    return {
      root: input.root,
      read: input.read,
      label: input.label ?? 'ChapterBook',
      noun: input.noun ?? 'chapter',
      recordKind: input.recordKind ?? 'record',
    };
  },
} as const;

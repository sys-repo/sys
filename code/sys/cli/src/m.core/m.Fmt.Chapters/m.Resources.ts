import { decodeBase64 } from '@std/encoding';
import { Is, MediaType, type t } from '../common.ts';

type O = Record<string, unknown>;

type Options<TFile extends string> = {
  readonly json: Record<string, string>;
  readonly parse: t.CliFormatChapters.Resources.Parser<TFile>;
  readonly label: string;
};

/** Embedded resource reader for bundled help/chapter resources. */
export const Resources: t.CliFormatChapters.Resources.Lib = Object.freeze({
  create<TFile extends string>(input: t.CliFormatChapters.Resources.Input<TFile>) {
    const options = wrangle.options(input);

    const readText = (file: TFile): string => {
      const dataUri = options.json[file];
      if (!Is.str(dataUri)) throw new Error(`${options.label}: resource not found: ${file}`);

      return decodeDataUriText(dataUri, file, options);
    };

    const readParsedRecord = (file: TFile): unknown => {
      return options.parse(readText(file), file);
    };

    const readRecord = (file: TFile, fields: readonly string[]): O => {
      const data = readParsedRecord(file);
      if (!Is.record<O>(data)) {
        throw new Error(`${options.label}: resource must be a record: ${file}`);
      }
      requireFields(data, fields, options);
      return data;
    };

    return { readText, readParsedRecord, readRecord };
  },
});

/**
 * Helpers:
 */

function decodeDataUriText<TFile extends string>(
  fileUri: string,
  file: TFile,
  options: Options<TFile>,
) {
  const comma = fileUri.indexOf(',');
  const header = comma < 0 ? '' : fileUri.slice(0, comma);
  const mediaType = MediaType.fromDataUri(fileUri);
  const isBase64 = header.toLowerCase().endsWith(';base64');

  if (!isBase64 || !mediaType || !MediaType.Is.text(mediaType)) {
    throw new Error(`${options.label}: resource is not text: ${file}`);
  }

  const data = decodeBase64(fileUri.slice(comma + 1));
  return new TextDecoder().decode(data);
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

const wrangle = {
  options<TFile extends string>(input: t.CliFormatChapters.Resources.Input<TFile>): Options<TFile> {
    return {
      json: input.json,
      parse: input.parse,
      label: input.label ?? 'ChapterResources',
    };
  },
} as const;

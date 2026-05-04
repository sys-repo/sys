import { Is, Str, Yaml } from '../common.ts';

export type O = Record<string, unknown>;
export type Pair = readonly [string, string];

export const HelpYaml = {
  record(text: string, path: string): O {
    const parsed = Yaml.parse<unknown>(text);
    if (parsed.error) {
      const cause = parsed.error;
      throw new Error(`CellHelp: failed to parse resource YAML: ${path}`, { cause });
    }

    const data = parsed.data;
    if (!Is.record<O>(data)) {
      throw new Error(`CellHelp: resource must be a YAML record: ${path}`);
    }
    return data;
  },

  string(data: O, field: string): string {
    const value = data[field];
    if (!Is.str(value)) throw new Error(`CellHelp: field must be a string: ${field}`);
    return Str.trimEdgeNewlines(value);
  },

  lines(data: O, field: string): readonly string[] {
    return HelpYaml.string(data, field).split('\n').filter((line) => line.length > 0);
  },

  list(data: O, field: string): readonly string[] {
    const value = data[field];
    if (!Is.array<string>(value) || !value.every(Is.str)) {
      throw new Error(`CellHelp: field must be a string list: ${field}`);
    }
    return value;
  },

  pairs(data: O, field: string): readonly Pair[] {
    const value = data[field];
    if (!Is.array<O>(value) || !value.every(isPairRecord)) {
      throw new Error(`CellHelp: field must be a pair record list: ${field}`);
    }
    return value.map((item) => [item.name, item.text] as const);
  },

  require(data: O, fields: readonly string[]) {
    fields.forEach((field) => {
      if (!(field in data)) throw new Error(`CellHelp: missing field: ${field}`);
    });
  },
} as const;

/**
 * Helpers:
 */

function isPairRecord(input: unknown): input is { readonly name: string; readonly text: string } {
  return Is.record<{ readonly name: unknown; readonly text: unknown }>(input) &&
    Is.str(input.name) && Is.str(input.text);
}

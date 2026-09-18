import { Is, Str, type t, Yaml } from '../common.ts';

type O = Record<string, unknown>;

export const HelpYaml = {
  record(text: string, path: string): O {
    const parsed = Yaml.parse<unknown>(text);
    if (parsed.error) {
      const cause = parsed.error;
      throw new Error(`Help: failed to parse resource YAML: ${path}`, { cause });
    }

    const data = parsed.data;
    if (!Is.record<O>(data)) {
      throw new Error(`Help: resource must be a YAML record: ${path}`);
    }
    return data;
  },

  string(data: O, field: string): string {
    const value = data[field];
    if (!Is.str(value)) throw new Error(`Help: field must be a string: ${field}`);
    return Str.trimEdgeNewlines(value);
  },

  sections(data: O, field: string): readonly t.Help.Section[] {
    const value = data[field];
    if (!Is.array<O>(value) || !value.every(isSectionRecord)) {
      throw new Error(`Help: field must be a section record list: ${field}`);
    }

    return value.map((item) => ({
      label: item.label,
      items: sectionItems(item.items),
    }));
  },
} as const;

/**
 * Helpers:
 */
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
